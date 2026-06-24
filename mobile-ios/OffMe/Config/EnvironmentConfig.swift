import Foundation

enum EnvironmentConfig {
    enum Environment: String {
        case development
        case staging
        case production
    }

    static var currentEnvironment: Environment {
        #if DEBUG
        if ProcessInfo.processInfo.environment["ENVIRONMENT"] == "staging" {
            return .staging
        }
        return .development
        #else
        return .production
        #endif
    }

    static var isDevelopment: Bool {
        currentEnvironment == .development
    }

    static var isStaging: Bool {
        currentEnvironment == .staging
    }

    static var isProduction: Bool {
        currentEnvironment == .production
    }

    // Environment-specific configurations
    static var baseURL: String {
        switch currentEnvironment {
        case .development:
            return "https://offme-dev.vercel.app/api/v1"
        case .staging:
            return "https://offme-staging.vercel.app/api/v1"
        case .production:
            return "https://offme.vercel.app/api/v1"
        }
    }

    static var supabaseURL: String {
        switch currentEnvironment {
        case .development:
            return "https://mojmkhuafptpvwrprxqg.supabase.co"
        case .staging:
            return "https://mojmkhuafptpvwrprxqg.supabase.co"
        case .production:
            return "https://mojmkhuafptpvwrprxqg.supabase.co"
        }
    }

    static var supabaseAnonKey: String {
        switch currentEnvironment {
        case .development:
            return "sb_publishable__3x5fSHfdWSMtQ3xAKNB9A_u25kjxIA"
        case .staging:
            return "sb_publishable__3x5fSHfdWSMtQ3xAKNB9A_u25kjxIA"
        case .production:
            return "sb_publishable__3x5fSHfdWSMtQ3xAKNB9A_u25kjxIA"
        }
    }

    static var analyticsEnabled: Bool {
        switch currentEnvironment {
        case .development:
            return false
        case .staging:
            return true
        case .production:
            return true
        }
    }

    static var debugLoggingEnabled: Bool {
        switch currentEnvironment {
        case .development:
            return true
        case .staging:
            return true
        case .production:
            return false
        }
    }

    static var environmentName: String {
        switch currentEnvironment {
        case .development:
            return "Development"
        case .staging:
            return "Staging"
        case .production:
            return "Production"
        }
    }
}
<task_progress>
- [x] Explore iOS project structure
- [x] Identify existing configuration files
- [x] Determine what configurations need to be added
- [x] Add necessary configuration files
- [x] Update project settings if needed
</task_progress>