//
//  ImageCacheService.swift
//  OffMe
//
//  Created for OffMe social media platform
//  Image caching service with LRU cache and disk persistence
//

import UIKit
import Foundation

/**
 * Image Cache Service for OffMe iOS App
 *
 * Provides comprehensive image caching with:
 * - Memory cache (LRU with size limit)
 * - Disk cache (persistent storage)
 * - Automatic cache invalidation
 * - Image preprocessing and resizing
 * - Network-aware caching strategies
 *
 * Usage:
 *   let cache = ImageCacheService.shared
 *   cache.loadImage(from: url) { image in
 *       // Use the cached or downloaded image
 *   }
 */
class ImageCacheService {

    // Singleton instance
    static let shared = ImageCacheService()

    // Configuration
    private let memoryCacheSizeLimit: Int = 100 * 1024 * 1024 // 100MB
    private let diskCacheSizeLimit: UInt = 500 * 1024 * 1024 // 500MB
    private let diskCacheExpiration: TimeInterval = 7 * 24 * 60 * 60 // 7 days

    // Memory cache (LRU)
    private lazy var memoryCache: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.totalCostLimit = memoryCacheSizeLimit
        cache.countLimit = 200 // Max number of items
        cache.name = "com.offme.imageCache.memory"
        return cache
    }()

    // Disk cache
    private lazy var diskCache: DiskCache = {
        let cache = DiskCache(sizeLimit: diskCacheSizeLimit, expiration: diskCacheExpiration)
        return cache
    }()

    // Image download queue
    private let downloadQueue = DispatchQueue(label: "com.offme.imageCache.download", qos: .utility)

    // Network monitor
    private let networkMonitor = NetworkMonitor.shared

    // Initialize
    private init() {
        setupCache()
        setupNotifications()
    }

    /**
     * Setup cache configuration
     */
    private func setupCache() {
        // Configure memory cache
        memoryCache.evictsObjectsWithDiscardedContent = true

        // Setup disk cache directory
        let cacheDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
        let imageCacheDirectory = cacheDirectory.appendingPathComponent("com.offme.imageCache")

        do {
            try FileManager.default.createDirectory(at: imageCacheDirectory, withIntermediateDirectories: true, attributes: nil)
            diskCache.setup(with: imageCacheDirectory)
        } catch {
            print("Failed to setup image cache directory: \(error)")
        }
    }

    /**
     * Setup system notifications
     */
    private func setupNotifications() {
        // Clear memory cache on memory warning
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(clearMemoryCache),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )

        // Cleanup disk cache when app enters background
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(cleanupDiskCache),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Public Methods

    /**
     * Load image from URL with caching
     *
     * - Parameter url: Image URL
     * - Parameter targetSize: Optional target size for resizing
     * - Parameter completion: Completion handler with loaded image
     * - Returns: Cancelable task
     */
    @discardableResult
    func loadImage(
        from url: URL,
        targetSize: CGSize? = nil,
        completion: @escaping (UIImage?) -> Void
    ) -> URLSessionDataTask? {

        // Check memory cache first
        if let cachedImage = getImageFromMemoryCache(for: url, targetSize: targetSize) {
            completion(cachedImage)
            return nil
        }

        // Check disk cache
        if let cachedImage = getImageFromDiskCache(for: url, targetSize: targetSize) {
            // Store in memory cache for future access
            storeImageInMemoryCache(cachedImage, for: url, targetSize: targetSize)
            completion(cachedImage)
            return nil
        }

        // Download image if not in cache
        return downloadImage(from: url, targetSize: targetSize, completion: completion)
    }

    /**
     * Preload images for better user experience
     *
     * - Parameter urls: Array of image URLs to preload
     */
    func preloadImages(_ urls: [URL]) {
        downloadQueue.async {
            for url in urls {
                // Only preload if not already in cache
                if getImageFromMemoryCache(for: url) == nil &&
                   getImageFromDiskCache(for: url) == nil {
                    _ = downloadImage(from: url, targetSize: nil, completion: { _ in })
                }
            }
        }
    }

    /**
     * Clear all caches
     */
    func clearAllCaches() {
        clearMemoryCache()
        clearDiskCache()
    }

    /**
     * Get cache statistics
     */
    func getCacheStats() -> CacheStats {
        let memoryCount = memoryCache.totalCostLimit
        let diskStats = diskCache.getStats()

        return CacheStats(
            memoryCacheSize: memoryCount,
            diskCacheSize: diskStats.size,
            diskCacheCount: diskStats.count
        )
    }

    // MARK: - Memory Cache Methods

    /**
     * Get image from memory cache
     */
    private func getImageFromMemoryCache(for url: URL, targetSize: CGSize? = nil) -> UIImage? {
        let cacheKey = cacheKey(for: url, targetSize: targetSize)
        return memoryCache.object(forKey: cacheKey as NSString)
    }

    /**
     * Store image in memory cache
     */
    private func storeImageInMemoryCache(_ image: UIImage, for url: URL, targetSize: CGSize? = nil) {
        let cacheKey = cacheKey(for: url, targetSize: targetSize)

        // Calculate cost based on image size
        let bytesPerPixel = 4 // RGBA
        let cost = image.size.width * image.size.height * bytesPerPixel

        memoryCache.setObject(image, forKey: cacheKey as NSString, cost: Int(cost))
    }

    /**
     * Clear memory cache
     */
    @objc private func clearMemoryCache() {
        memoryCache.removeAllObjects()
    }

    // MARK: - Disk Cache Methods

    /**
     * Get image from disk cache
     */
    private func getImageFromDiskCache(for url: URL, targetSize: CGSize? = nil) -> UIImage? {
        let cacheKey = cacheKey(for: url, targetSize: targetSize)
        return diskCache.getImage(forKey: cacheKey)
    }

    /**
     * Store image in disk cache
     */
    private func storeImageInDiskCache(_ image: UIImage, for url: URL, targetSize: CGSize? = nil) {
        let cacheKey = cacheKey(for: url, targetSize: targetSize)
        diskCache.store(image, forKey: cacheKey)
    }

    /**
     * Clear disk cache
     */
    private func clearDiskCache() {
        diskCache.clear()
    }

    /**
     * Cleanup disk cache (remove expired items)
     */
    @objc private func cleanupDiskCache() {
        diskCache.cleanupExpiredItems()
    }

    // MARK: - Image Download Methods

    /**
     * Download image from URL
     */
    private func downloadImage(
        from url: URL,
        targetSize: CGSize? = nil,
        completion: @escaping (UIImage?) -> Void
    ) -> URLSessionDataTask? {

        // Check network connectivity
        guard networkMonitor.isConnected else {
            completion(nil)
            return nil
        }

        // Use URLSession for downloading
        let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self else { return }

            // Handle errors
            if let error = error {
                print("Image download failed: \(error)")
                DispatchQueue.main.async {
                    completion(nil)
                }
                return
            }

            // Check for valid HTTP response
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode),
                  let imageData = data,
                  let image = UIImage(data: imageData) else {
                DispatchQueue.main.async {
                    completion(nil)
                }
                return
            }

            // Resize image if target size is specified
            let finalImage = targetSize.flatMap { self.resizeImage(image, to: $0) } ?? image

            // Store in both caches
            self.storeImageInMemoryCache(finalImage, for: url, targetSize: targetSize)
            self.storeImageInDiskCache(finalImage, for: url, targetSize: targetSize)

            // Call completion on main thread
            DispatchQueue.main.async {
                completion(finalImage)
            }
        }

        task.resume()
        return task
    }

    /**
     * Resize image to target size
     */
    private func resizeImage(_ image: UIImage, to targetSize: CGSize) -> UIImage? {
        let size = image.size

        // Calculate aspect ratio
        let widthRatio = targetSize.width / size.width
        let heightRatio = targetSize.height / size.height
        let ratio = min(widthRatio, heightRatio)

        // Calculate new size
        let newSize = CGSize(
            width: size.width * ratio,
            height: size.height * ratio
        )

        // Create graphics context
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let newImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return newImage
    }

    // MARK: - Cache Key Generation

    /**
     * Generate cache key for URL and optional target size
     */
    private func cacheKey(for url: URL, targetSize: CGSize? = nil) -> String {
        var key = url.absoluteString

        if let targetSize = targetSize {
            key += "_\(Int(targetSize.width))x\(Int(targetSize.height))"
        }

        // Create MD5 hash for consistent key length
        if let data = key.data(using: .utf8) {
            var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
            _ = data.withUnsafeBytes {
                CC_MD5($0.baseAddress, CC_LONG(data.count), &digest)
            }
            return digest.map { String(format: "%02hhx", $0) }.joined()
        }

        return key
    }

    // MARK: - Cache Statistics

    struct CacheStats {
        let memoryCacheSize: Int
        let diskCacheSize: UInt
        let diskCacheCount: Int
    }
}

// MARK: - Disk Cache Implementation

private class DiskCache {
    private let sizeLimit: UInt
    private let expiration: TimeInterval
    private var cacheDirectory: URL?
    private let fileManager = FileManager.default
    private let ioQueue = DispatchQueue(label: "com.offme.imageCache.disk", qos: .utility)

    init(sizeLimit: UInt, expiration: TimeInterval) {
        self.sizeLimit = sizeLimit
        self.expiration = expiration
    }

    func setup(with directory: URL) {
        cacheDirectory = directory
    }

    func getImage(forKey key: String) -> UIImage? {
        guard let cacheDirectory = cacheDirectory else { return nil }

        let fileURL = cacheDirectory.appendingPathComponent(key)

        // Check if file exists and is not expired
        guard fileManager.fileExists(atPath: fileURL.path),
              !isFileExpired(at: fileURL) else {
            return nil
        }

        do {
            let imageData = try Data(contentsOf: fileURL)
            return UIImage(data: imageData)
        } catch {
            print("Failed to read image from disk cache: \(error)")
            return nil
        }
    }

    func store(_ image: UIImage, forKey key: String) {
        guard let cacheDirectory = cacheDirectory else { return }

        let fileURL = cacheDirectory.appendingPathComponent(key)

        ioQueue.async {
            do {
                // Convert image to data (PNG format)
                guard let imageData = image.pngData() else { return }

                // Write to disk
                try imageData.write(to: fileURL, options: [.atomic])

                // Cleanup if size limit exceeded
                self.cleanupIfNeeded()
            } catch {
                print("Failed to store image in disk cache: \(error)")
            }
        }
    }

    func clear() {
        guard let cacheDirectory = cacheDirectory else { return }

        ioQueue.async {
            do {
                let contents = try self.fileManager.contentsOfDirectory(
                    at: cacheDirectory,
                    includingPropertiesForKeys: nil,
                    options: []
                )

                for fileURL in contents {
                    try self.fileManager.removeItem(at: fileURL)
                }
            } catch {
                print("Failed to clear disk cache: \(error)")
            }
        }
    }

    func cleanupExpiredItems() {
        guard let cacheDirectory = cacheDirectory else { return }

        ioQueue.async {
            do {
                let contents = try self.fileManager.contentsOfDirectory(
                    at: cacheDirectory,
                    includingPropertiesForKeys: [.contentModificationDateKey],
                    options: []
                )

                for fileURL in contents {
                    if self.isFileExpired(at: fileURL) {
                        try self.fileManager.removeItem(at: fileURL)
                    }
                }
            } catch {
                print("Failed to cleanup expired disk cache items: \(error)")
            }
        }
    }

    func cleanupIfNeeded() {
        guard let cacheDirectory = cacheDirectory else { return }

        ioQueue.async {
            do {
                let contents = try self.fileManager.contentsOfDirectory(
                    at: cacheDirectory,
                    includingPropertiesForKeys: [.fileSizeKey],
                    options: []
                )

                var totalSize: UInt = 0
                for fileURL in contents {
                    let resourceValues = try fileURL.resourceValues(forKeys: [.fileSizeKey])
                    totalSize += resourceValues.fileSize ?? 0
                }

                // Cleanup if size limit exceeded
                if totalSize > self.sizeLimit {
                    // Sort by modification date (oldest first)
                    let sortedContents = try contents.sorted {
                        let resourceValues1 = try $0.resourceValues(forKeys: [.contentModificationDateKey])
                        let resourceValues2 = try $1.resourceValues(forKeys: [.contentModificationDateKey])

                        let date1 = resourceValues1.contentModificationDate ?? Date.distantPast
                        let date2 = resourceValues2.contentModificationDate ?? Date.distantPast

                        return date1 < date2
                    }

                    // Remove oldest files until under limit
                    for fileURL in sortedContents {
                        if totalSize <= self.sizeLimit {
                            break
                        }

                        let resourceValues = try fileURL.resourceValues(forKeys: [.fileSizeKey])
                        let fileSize = resourceValues.fileSize ?? 0
                        try self.fileManager.removeItem(at: fileURL)
                        totalSize -= fileSize
                    }
                }
            } catch {
                print("Failed to cleanup disk cache: \(error)")
            }
        }
    }

    func getStats() -> (size: UInt, count: Int) {
        guard let cacheDirectory = cacheDirectory else { return (0, 0) }

        do {
            let contents = try fileManager.contentsOfDirectory(
                at: cacheDirectory,
                includingPropertiesForKeys: [.fileSizeKey],
                options: []
            )

            var totalSize: UInt = 0
            for fileURL in contents {
                let resourceValues = try fileURL.resourceValues(forKeys: [.fileSizeKey])
                totalSize += resourceValues.fileSize ?? 0
            }

            return (totalSize, contents.count)
        } catch {
            print("Failed to get disk cache stats: \(error)")
            return (0, 0)
        }
    }

    private func isFileExpired(at fileURL: URL) -> Bool {
        do {
            let resourceValues = try fileURL.resourceValues(forKeys: [.contentModificationDateKey])
            guard let modificationDate = resourceValues.contentModificationDate else {
                return true
            }

            let currentDate = Date()
            return currentDate.timeIntervalSince(modificationDate) > expiration
        } catch {
            return true
        }
    }
}

// MARK: - Network Monitor

private class NetworkMonitor {
    static let shared = NetworkMonitor()
    private let monitor: NWPathMonitor
    private var status: NWPath.Status = .requiresConnection
    private let queue = DispatchQueue(label: "NetworkMonitor")

    private init() {
        monitor = NWPathMonitor()
        monitor.pathUpdateHandler = { [weak self] path in
            self?.status = path.status
        }
        monitor.start(queue: queue)
    }

    var isConnected: Bool {
        return status == .satisfied
    }
}