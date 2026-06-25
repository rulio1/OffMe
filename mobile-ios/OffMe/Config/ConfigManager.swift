import Foundation

/// Unified Configuration Manager for iOS App
/// Provides centralized access to all app configurations
enum ConfigManager {
    // MARK: - Core Configurations
    static var api: APIConfiguration {
        return APIConfiguration(
            baseURL: WebConfig.apiBaseURL,
            timeout: WebConfig.rateLimits.apiRequestTimeout,
            maxRetries: WebConfig.rateLimits.maxRetryAttempts,
            retryDelay: WebConfig.rateLimits.retryDelaySeconds
        )
    }

    static var supabase: SupabaseConfiguration {
        return SupabaseConfiguration(
            url: SupabaseConfig.url,
            anonKey: SupabaseConfig.anonKey,
            timeout: SupabaseConfig.connectionTimeout,
            maxRetries: SupabaseConfig.reconnectionAttempts,
            retryDelay: SupabaseConfig.reconnectionDelay
        )
    }

    static var environment: EnvironmentConfiguration {
        return EnvironmentConfiguration(
            current: EnvironmentConfig.currentEnvironment,
            isDevelopment: EnvironmentConfig.isDevelopment,
            isStaging: EnvironmentConfig.isStaging,
            isProduction: EnvironmentConfig.isProduction,
            name: EnvironmentConfig.environmentName
        )
    }

    // MARK: - Feature Management
    static var features: FeatureConfiguration {
        return FeatureConfiguration(
            flags: WebConfig.featureFlags,
            betaProgram: BetaConfiguration(
                isOpen: WebConfig.betaProgram.isOpen,
                feedbackEmail: WebConfig.betaProgram.feedbackEmail,
                minVersion: WebConfig.betaProgram.minAppVersion,
                expectedTesters: WebConfig.betaProgram.expectedTesters
            )
        )
    }

    // MARK: - App Configuration
    static var app: AppConfiguration {
        return AppConfiguration(
            name: AppConfig.appName,
            bundleId: AppConfig.bundleIdentifier,
            version: AppConfig.appVersion,
            buildNumber: AppConfig.buildNumber,
            isBeta: AppConfig.isBetaMode,
            analyticsEnabled: AppConfig.enableAnalytics,
            crashReportingEnabled: AppConfig.enableCrashReporting,
            debugLoggingEnabled: AppConfig.enableDebugLogging
        )
    }

    // MARK: - Web-like Configuration
    static var web: WebConfiguration {
        return WebConfiguration(
            siteURL: WebConfig.siteURL,
            privacyPolicyURL: WebConfig.privacyPolicyURL,
            termsOfServiceURL: WebConfig.termsOfServiceURL,
            supportURL: WebConfig.supportURL,
            aboutURL: WebConfig.aboutURL,
            socialLinks: WebConfig.socialLinks,
            adminUsernames: WebConfig.adminUsernames,
            plausibleDomain: WebConfig.plausibleDomain,
            analyticsEnabled: WebConfig.analyticsEnabled
        )
    }

    // MARK: - Limits and Constraints
    static var limits: LimitsConfiguration {
        return LimitsConfiguration(
            post: WebConfig.postLimits,
            user: WebConfig.userLimits,
            media: WebConfig.mediaLimits,
            cache: WebConfig.cacheSettings
        )
    }

    // MARK: - URL Configuration
    static var urls: URLConfiguration {
        return URLConfiguration(
            deepLinkScheme: WebConfig.deepLinkScheme,
            universalLinkDomain: WebConfig.universalLinkDomain,
            apiAlternatives: APIAlternatives(
                local: APIConfig.localURL,
                vercel: APIConfig.vercelURL,
                production: api.baseURL
            )
        )
    }

    // MARK: - Notification Configuration
    static var notifications: NotificationConfiguration {
        return NotificationConfiguration(
            defaultPreferences: WebConfig.defaultNotificationPrefs,
            pushEnabled: true,
            emailDigestEnabled: WebConfig.defaultNotificationPrefs.emailDigest
        )
    }

    // MARK: - Content Moderation
    static var moderation: ContentModerationConfiguration {
        return ContentModerationConfiguration(
            bannedWords: WebConfig.contentModeration.bannedWords,
            maxReportsBeforeReview: WebConfig.contentModeration.maxReportsBeforeReview,
            autoSuspendThreshold: WebConfig.contentModeration.autoSuspendThreshold
        )
    }
}

// MARK: - Configuration Data Structures
struct APIConfiguration {
    let baseURL: String
    let timeout: TimeInterval
    let maxRetries: Int
    let retryDelay: TimeInterval
}

struct SupabaseConfiguration {
    let url: String
    let anonKey: String
    let timeout: TimeInterval
    let maxRetries: Int
    let retryDelay: TimeInterval
}

struct EnvironmentConfiguration {
    let current: EnvironmentConfig.Environment
    let isDevelopment: Bool
    let isStaging: Bool
    let isProduction: Bool
    let name: String
}

struct FeatureConfiguration {
    let flags: [String: Bool]
    let betaProgram: BetaConfiguration
}

struct BetaConfiguration {
    let isOpen: Bool
    let feedbackEmail: String
    let minVersion: String
    let expectedTesters: Int
}

struct AppConfiguration {
    let name: String
    let bundleId: String
    let version: String
    let buildNumber: String
    let isBeta: Bool
    let analyticsEnabled: Bool
    let crashReportingEnabled: Bool
    let debugLoggingEnabled: Bool
}

struct WebConfiguration {
    let siteURL: String
    let privacyPolicyURL: String
    let termsOfServiceURL: String
    let supportURL: String
    let aboutURL: String
    let socialLinks: SocialLinks
    let adminUsernames: [String]
    let plausibleDomain: String
    let analyticsEnabled: Bool
}

struct LimitsConfiguration {
    let post: PostLimits
    let user: UserLimits
    let media: MediaLimits
    let cache: CacheSettings
}

struct URLConfiguration {
    let deepLinkScheme: String
    let universalLinkDomain: String
    let apiAlternatives: APIAlternatives
}

struct APIAlternatives {
    let local: String
    let vercel: String
    let production: String
}

struct NotificationConfiguration {
    let defaultPreferences: NotificationPrefs
    let pushEnabled: Bool
    let emailDigestEnabled: Bool
}

struct ContentModerationConfiguration {
    let bannedWords: [String]
    let maxReportsBeforeReview: Int
    let autoSuspendThreshold: Int
}

// MARK: - Configuration Access Extensions
extension ConfigManager {
    /// Get current API base URL
    static var currentAPIURL: String {
        return api.baseURL
    }

    /// Check if feature is enabled
    static func isFeatureEnabled(_ feature: String) -> Bool {
        return features.flags[feature] ?? false
    }

    /// Get current environment name
    static var currentEnvironment: String {
        return environment.name
    }

    /// Check if running in development
    static var isDevelopment: Bool {
        return environment.isDevelopment
    }

    /// Check if running in production
    static var isProduction: Bool {
        return environment.isProduction
    }

    /// Get app version info
    static var appVersionInfo: String {
        return "\(app.name) v\(app.version) (Build \(app.buildNumber))"
    }

    /// Get all admin usernames
    static var adminUsernames: [String] {
        return web.adminUsernames
    }
}

// MARK: - Configuration Utility Methods
extension ConfigManager {
    /// Print all configurations for debugging
    static func printAllConfigurations() {
        print("=== ConfigManager - Current Configuration ===")
        print("📱 App: \(app.name) v\(app.version)")
        print("🌐 Environment: \(currentEnvironment)")
        print("🔗 API URL: \(currentAPIURL)")
        print("📊 Analytics: \(web.analyticsEnabled ? "Enabled" : "Disabled")")
        print("🚀 Features: \(features.flags.count) configured")
        print("👥 Admins: \(adminUsernames.joined(separator: ", "))")
        print("📱 Beta Program: \(features.betaProgram.isOpen ? "Open" : "Closed")")
        print("🔒 Moderation: \(moderation.bannedWords.count) banned words")
        print("📦 Limits: Post(\(limits.post.maxLength) chars), Media(\(limits.media.maxUploadSizeMB)MB)")
    }

    /// Get configuration as dictionary for analytics/reporting
    static func getConfigurationDictionary() -> [String: Any] {
        return [
            "app_name": app.name,
            "app_version": app.version,
            "app_build": app.buildNumber,
            "environment": currentEnvironment,
            "api_url": currentAPIURL,
            "is_beta": app.isBeta,
            "analytics_enabled": web.analyticsEnabled,
            "feature_count": features.flags.count,
            "admin_count": adminUsernames.count,
            "beta_open": features.betaProgram.isOpen
        ]
    }
}
<task_progress>
- [x] Check web app configurations
- [x] Implement similar configurations for iOS
- [x] Create environment variables configuration
- [x] Add feature flags system
- [x] Implement API configuration similar to web
</task_progress>