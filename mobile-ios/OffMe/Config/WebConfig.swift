import Foundation

/// Web-like configuration system for iOS app
/// Mirrors the web frontend configuration approach
enum WebConfig {
    // MARK: - API Configuration (mirrors web api.ts)
    static var apiBaseURL: String {
        #if DEBUG
        // Local development override
        if ProcessInfo.processInfo.environment["IOS_USE_LOCAL_API"] == "1" {
            return "http://localhost:3000/api/v1"
        }
        #endif

        // Environment-specific base URL
        return EnvironmentConfig.baseURL
    }

    // MARK: - Feature Flags (mirrors web feature system)
    static var featureFlags: [String: Bool] = [
        "betaBanner": true,
        "experimentalFeed": false,
        "newComposer": true,
        "pushNotifications": true,
        "analytics": true,
        "communityFeatures": true,
        "verificationSystem": false
    ]

    // MARK: - Admin Configuration (mirrors web .env)
    static var adminUsernames: [String] = ["rulio"]

    // MARK: - Analytics Configuration
    static var plausibleDomain: String = "offme.vercel.app"
    static var analyticsEnabled: Bool = true

    // MARK: - App Limits (mirrors web constraints)
    static let postLimits = PostLimits(
        maxLength: 500,
        maxMediaCount: 4,
        maxPollOptions: 4
    )

    static let userLimits = UserLimits(
        maxUsernameLength: 30,
        maxDisplayNameLength: 50,
        maxBioLength: 160,
        maxWebsiteUrlLength: 200
    )

    static let mediaLimits = MediaLimits(
        maxUploadSizeMB: 10,
        supportedImageTypes: ["image/jpeg", "image/png", "image/gif"],
        supportedVideoTypes: ["video/mp4", "video/quicktime"]
    )

    // MARK: - URL Configuration (mirrors web routes)
    static let siteURL: String = "https://offme.vercel.app"
    static let privacyPolicyURL: String = "\(siteURL)/privacy"
    static let termsOfServiceURL: String = "\(siteURL)/terms"
    static let supportURL: String = "\(siteURL)/support"
    static let aboutURL: String = "\(siteURL)/about"

    // MARK: - Social Media Links
    static let socialLinks = SocialLinks(
        twitter: "https://twitter.com/offmeapp",
        instagram: "https://instagram.com/offmeapp",
        github: "https://github.com/rulio1/OffMe"
    )

    // MARK: - Cache Configuration
    static let cacheSettings = CacheSettings(
        imageCacheSizeMB: 100,
        postCacheCount: 200,
        userCacheCount: 500,
        timelineCacheExpirationMinutes: 30
    )

    // MARK: - Notification Settings
    static let defaultNotificationPrefs = NotificationPrefs(
        pushLikes: true,
        pushReplies: true,
        pushFollows: true,
        pushReposts: true,
        pushQuotes: true,
        pushDm: true,
        emailDigest: false
    )

    // MARK: - Rate Limiting
    static let rateLimits = RateLimits(
        apiRequestTimeout: 30,
        maxConcurrentRequests: 5,
        retryDelaySeconds: 2,
        maxRetryAttempts: 3
    )

    // MARK: - Deep Linking
    static let deepLinkScheme: String = "offme"
    static let universalLinkDomain: String = "offme.vercel.app"

    // MARK: - Beta Program Configuration
    static let betaProgram = BetaProgram(
        isOpen: true,
        feedbackEmail: "beta@offme.vercel.app",
        minAppVersion: "1.0.0",
        expectedTesters: 500
    )

    // MARK: - Content Moderation
    static let contentModeration = ContentModeration(
        bannedWords: ["spam", "scam", "hate"],
        maxReportsBeforeReview: 3,
        autoSuspendThreshold: 5
    )
}

// MARK: - Supporting Data Structures
struct PostLimits {
    let maxLength: Int
    let maxMediaCount: Int
    let maxPollOptions: Int
}

struct UserLimits {
    let maxUsernameLength: Int
    let maxDisplayNameLength: Int
    let maxBioLength: Int
    let maxWebsiteUrlLength: Int
}

struct MediaLimits {
    let maxUploadSizeMB: Int
    let supportedImageTypes: [String]
    let supportedVideoTypes: [String]
}

struct SocialLinks {
    let twitter: String
    let instagram: String
    let github: String
}

struct CacheSettings {
    let imageCacheSizeMB: Int
    let postCacheCount: Int
    let userCacheCount: Int
    let timelineCacheExpirationMinutes: Int
}

struct NotificationPrefs {
    let pushLikes: Bool
    let pushReplies: Bool
    let pushFollows: Bool
    let pushReposts: Bool
    let pushQuotes: Bool
    let pushDm: Bool
    let emailDigest: Bool
}

struct RateLimits {
    let apiRequestTimeout: TimeInterval
    let maxConcurrentRequests: Int
    let retryDelaySeconds: TimeInterval
    let maxRetryAttempts: Int
}

struct BetaProgram {
    let isOpen: Bool
    let feedbackEmail: String
    let minAppVersion: String
    let expectedTesters: Int
}

struct ContentModeration {
    let bannedWords: [String]
    let maxReportsBeforeReview: Int
    let autoSuspendThreshold: Int
}

// MARK: - Feature Flag Management
extension WebConfig {
    static func isFeatureEnabled(_ feature: String) -> Bool {
        return featureFlags[feature] ?? false
    }

    static func setFeatureFlag(_ feature: String, enabled: Bool) {
        featureFlags[feature] = enabled
    }

    static func toggleFeatureFlag(_ feature: String) {
        featureFlags[feature] = !(featureFlags[feature] ?? false)
    }
}

// MARK: - Environment Detection
extension WebConfig {
    static var isDevelopment: Bool {
        return EnvironmentConfig.isDevelopment
    }

    static var isStaging: Bool {
        return EnvironmentConfig.isStaging
    }

    static var isProduction: Bool {
        return EnvironmentConfig.isProduction
    }

    static var currentEnvironmentName: String {
        return EnvironmentConfig.environmentName
    }
}
<task_progress>
- [x] Check web app configurations
- [x] Implement similar configurations for iOS
- [x] Create environment variables configuration
- [x] Add feature flags system
- [x] Implement API configuration similar to web
</task_progress>