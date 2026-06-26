package com.offme.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.security.MessageDigest

/**
 * Image Cache for OffMe Android App
 *
 * Comprehensive image caching solution with:
 * - Memory cache (LRU with size limit)
 * - Disk cache (persistent storage)
 * - Automatic cache invalidation
 * - Image preprocessing and resizing
 * - Network-aware caching strategies
 *
 * Usage:
 *   val cache = ImageCache.getInstance(context)
 *   cache.loadImage(url) { bitmap ->
 *       // Use the cached or downloaded bitmap
 *   }
 */
class ImageCache private constructor(private val context: Context) {

    companion object {
        @Volatile
        private var instance: ImageCache? = null

        /**
         * Get singleton instance of ImageCache
         */
        fun getInstance(context: Context): ImageCache {
            return instance ?: synchronized(this) {
                instance ?: ImageCache(context).also { instance = it }
            }
        }
    }

    // Configuration
    private val memoryCacheSize: Int = (Runtime.getRuntime().maxMemory() / 8).toInt() // 1/8 of available memory
    private val diskCacheSize: Long = 500 * 1024 * 1024 // 500MB
    private val diskCacheExpiration: Long = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    // Memory cache (LRU)
    private val memoryCache: LruCache<String, Bitmap>

    // Disk cache directory
    private val diskCacheDir: File

    // Handler for main thread
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        // Initialize memory cache
        memoryCache = object : LruCache<String, Bitmap>(memoryCacheSize) {
            override fun sizeOf(key: String, bitmap: Bitmap): Int {
                // Return size in bytes
                return bitmap.byteCount
            }
        }

        // Initialize disk cache directory
        diskCacheDir = File(context.cacheDir, "offme_image_cache")
        if (!diskCacheDir.exists()) {
            diskCacheDir.mkdirs()
        }

        // Cleanup expired files on init
        cleanupExpiredFiles()
    }

    // MARK: - Public Methods

    /**
     * Load image from URL with caching
     *
     * @param url Image URL
     * @param targetWidth Optional target width for resizing
     * @param targetHeight Optional target height for resizing
     * @param callback Callback with loaded bitmap
     */
    fun loadImage(
        url: String,
        targetWidth: Int? = null,
        targetHeight: Int? = null,
        callback: (Bitmap?) -> Unit
    ) {
        // Check memory cache first
        val cacheKey = getCacheKey(url, targetWidth, targetHeight)
        val memoryCachedBitmap = getBitmapFromMemoryCache(cacheKey)

        if (memoryCachedBitmap != null) {
            callback(memoryCachedBitmap)
            return
        }

        // Check disk cache
        val diskCachedBitmap = getBitmapFromDiskCache(cacheKey)

        if (diskCachedBitmap != null) {
            // Store in memory cache for future access
            addBitmapToMemoryCache(cacheKey, diskCachedBitmap)
            callback(diskCachedBitmap)
            return
        }

        // Download image if not in cache
        downloadImage(url, targetWidth, targetHeight) { bitmap ->
            if (bitmap != null) {
                // Store in both caches
                addBitmapToMemoryCache(cacheKey, bitmap)
                addBitmapToDiskCache(cacheKey, bitmap)
            }
            callback(bitmap)
        }
    }

    /**
     * Preload images for better user experience
     *
     * @param urls Array of image URLs to preload
     */
    fun preloadImages(urls: List<String>) {
        Thread {
            for (url in urls) {
                // Only preload if not already in cache
                val cacheKey = getCacheKey(url)
                if (getBitmapFromMemoryCache(cacheKey) == null &&
                    getBitmapFromDiskCache(cacheKey) == null) {
                    downloadImage(url, null, null) { _ -> }
                }
            }
        }.start()
    }

    /**
     * Clear all caches
     */
    fun clearAllCaches() {
        clearMemoryCache()
        clearDiskCache()
    }

    /**
     * Get cache statistics
     */
    fun getCacheStats(): CacheStats {
        val memorySize = memoryCache.size()
        val diskStats = getDiskCacheStats()

        return CacheStats(
            memoryCacheSize = memorySize,
            diskCacheSize = diskStats.size,
            diskCacheCount = diskStats.count
        )
    }

    // MARK: - Memory Cache Methods

    /**
     * Get bitmap from memory cache
     */
    private fun getBitmapFromMemoryCache(key: String): Bitmap? {
        return memoryCache[key]
    }

    /**
     * Add bitmap to memory cache
     */
    private fun addBitmapToMemoryCache(key: String, bitmap: Bitmap) {
        if (getBitmapFromMemoryCache(key) == null) {
            memoryCache.put(key, bitmap)
        }
    }

    /**
     * Clear memory cache
     */
    private fun clearMemoryCache() {
        memoryCache.evictAll()
    }

    // MARK: - Disk Cache Methods

    /**
     * Get bitmap from disk cache
     */
    private fun getBitmapFromDiskCache(key: String): Bitmap? {
        val file = File(diskCacheDir, key)

        // Check if file exists and is not expired
        if (!file.exists() || isFileExpired(file)) {
            return null
        }

        return try {
            BitmapFactory.decodeFile(file.absolutePath)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Add bitmap to disk cache
     */
    private fun addBitmapToDiskCache(key: String, bitmap: Bitmap) {
        val file = File(diskCacheDir, key)

        try {
            // Compress bitmap to PNG
            val outputStream = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            outputStream.close()

            // Cleanup if size limit exceeded
            cleanupIfNeeded()
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }

    /**
     * Clear disk cache
     */
    private fun clearDiskCache() {
        try {
            val files = diskCacheDir.listFiles()
            if (files != null) {
                for (file in files) {
                    file.delete()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Cleanup expired files from disk cache
     */
    private fun cleanupExpiredFiles() {
        try {
            val files = diskCacheDir.listFiles()
            if (files != null) {
                for (file in files) {
                    if (isFileExpired(file)) {
                        file.delete()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Check if file is expired
     */
    private fun isFileExpired(file: File): Boolean {
        val currentTime = System.currentTimeMillis()
        val lastModified = file.lastModified()
        return currentTime - lastModified > diskCacheExpiration
    }

    /**
     * Cleanup disk cache if size limit exceeded
     */
    private fun cleanupIfNeeded() {
        var totalSize: Long = 0
        val files = diskCacheDir.listFiles() ?: return

        // Calculate total size
        for (file in files) {
            totalSize += file.length()
        }

        // Cleanup if size limit exceeded
        if (totalSize > diskCacheSize) {
            // Sort files by last modified (oldest first)
            val sortedFiles = files.sortedBy { it.lastModified() }

            // Remove oldest files until under limit
            for (file in sortedFiles) {
                if (totalSize <= diskCacheSize) {
                    break
                }
                val fileSize = file.length()
                file.delete()
                totalSize -= fileSize
            }
        }
    }

    /**
     * Get disk cache statistics
     */
    private fun getDiskCacheStats(): DiskCacheStats {
        var totalSize: Long = 0
        var fileCount = 0

        try {
            val files = diskCacheDir.listFiles()
            if (files != null) {
                for (file in files) {
                    if (!isFileExpired(file)) {
                        totalSize += file.length()
                        fileCount++
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return DiskCacheStats(totalSize, fileCount)
    }

    // MARK: - Image Download Methods

    /**
     * Download image from URL
     */
    private fun downloadImage(
        url: String,
        targetWidth: Int?,
        targetHeight: Int?,
        callback: (Bitmap?) -> Unit
    ) {
        Thread {
            try {
                // Check network connectivity
                if (!isNetworkAvailable()) {
                    mainHandler.post { callback(null) }
                    return@Thread
                }

                // Download image data
                val urlObj = java.net.URL(url)
                val connection = urlObj.openConnection() as java.net.HttpURLConnection
                connection.doInput = true
                connection.connect()

                val responseCode = connection.responseCode
                if (responseCode != java.net.HttpURLConnection.HTTP_OK) {
                    mainHandler.post { callback(null) }
                    return@Thread
                }

                val inputStream = connection.inputStream
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()
                connection.disconnect()

                // Resize if target dimensions are specified
                val finalBitmap = if (targetWidth != null && targetHeight != null) {
                    resizeBitmap(bitmap, targetWidth!!, targetHeight!!)
                } else {
                    bitmap
                }

                mainHandler.post { callback(finalBitmap) }
            } catch (e: Exception) {
                e.printStackTrace()
                mainHandler.post { callback(null) }
            }
        }.start()
    }

    /**
     * Resize bitmap to target dimensions
     */
    private fun resizeBitmap(bitmap: Bitmap, targetWidth: Int, targetHeight: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height

        // Calculate aspect ratio
        val widthRatio = targetWidth.toFloat() / width
        val heightRatio = targetHeight.toFloat() / height
        val ratio = Math.min(widthRatio, heightRatio)

        // Calculate new dimensions
        val newWidth = (width * ratio).toInt()
        val newHeight = (height * ratio).toInt()

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

    /**
     * Check network availability
     */
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val networkInfo = connectivityManager.activeNetworkInfo
        return networkInfo != null && networkInfo.isConnected
    }

    // MARK: - Cache Key Generation

    /**
     * Generate cache key for URL and optional target dimensions
     */
    private fun getCacheKey(url: String, targetWidth: Int? = null, targetHeight: Int? = null): String {
        var key = url

        if (targetWidth != null && targetHeight != null) {
            key += "_${targetWidth}x$targetHeight"
        }

        // Create MD5 hash for consistent key length
        return try {
            val bytes = key.toByteArray()
            val md = MessageDigest.getInstance("MD5")
            val digest = md.digest(bytes)
            digest.fold("") { str, it -> str + "%02x".format(it) }
        } catch (e: Exception) {
            key
        }
    }

    // MARK: - Data Classes

    data class CacheStats(
        val memoryCacheSize: Int,
        val diskCacheSize: Long,
        val diskCacheCount: Int
    )

    private data class DiskCacheStats(
        val size: Long,
        val count: Int
    )
}