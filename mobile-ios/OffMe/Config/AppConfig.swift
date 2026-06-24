import Foundation

enum AppConfig {
    // App Information
    static let appName = "OffMe"
    static let bundleIdentifier = "com.offme.app"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"

    // Feature Flags
    static var isBetaMode: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }

    static var enableAnalytics: Bool = true
    static var enableCrashReporting: Bool = true
    static var enableDebugLogging: Bool = false

    // API Configuration
    static var apiBaseURL: String {
        #if DEBUG
        // Check if using local API via environment variable
        if ProcessInfo.processInfo.environment["IOS_USE_LOCAL_API"] == "1" {
            return "http://localhost:3000/api/v1"
        }
        #endif
        return APIConfig.baseURL
    }

    // App URLs
    static let termsOfServiceURL = "https://offme.vercel.app/terms"
    static let privacyPolicyURL = "https://offme.vercel.app/privacy"
    static let supportURL = "https://offme.vercel.app/support"
    static let appStoreURL = "https://apps.apple.com/app/offme/idYOUR_APP_ID"

    // App Limits
    static let maxPostLength = 500
    static let maxBioLength = 160
    static let maxUsernameLength = 30
    static let maxDisplayNameLength = 50

    // Image Configuration
    static let maxImageUploadSizeMB = 10
    static let profileImageSize: CGSize = CGSize(width: 400, height: 400)
    static let postImageSize: CGSize = CGSize(width: 1200, height: 1200)

    // Cache Configuration
    static let imageCacheSizeMB = 100
    static let postCacheCount = 200
    static let userCacheCount = 500

    // Notification Configuration
    static let maxPushNotificationLength = 100
    static let notificationExpirationDays = 30

    // Rate Limiting
    static let apiRequestTimeout: TimeInterval = 30
    static let maxConcurrentAPIRequests = 5

    // Deep Linking
    static let deepLinkScheme = "offme"
    static let universalLinkDomain = "offme.vercel.app"

    // Social Media
    static let twitterHandle = "@offmeapp"
    static let instagramHandle = "@offmeapp"
    static let githubURL = "https://github.com/rulio1/OffMe"
}
<task_progress>
- [x] Explore iOS project structure
- [x] Identify existing configuration files
- [x] Determine what configurations need to be added
- [x] Add necessary configuration files
- [x] Update project settings if needed
</task_progress>