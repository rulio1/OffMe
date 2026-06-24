import Foundation

enum APIConfig {
    /// Base URL configuration that respects environment settings
    static var baseURL: String {
        // Check for local development override first
        #if DEBUG
        if ProcessInfo.processInfo.environment["IOS_USE_LOCAL_API"] == "1" {
            return "http://localhost:3000/api/v1"
        }
        #endif

        // Use environment-specific configuration
        return EnvironmentConfig.baseURL
    }

    /// Alternative API endpoints
    static let vercelURL = "https://offme.vercel.app/api/v1"
    static let localURL = "http://localhost:3000/api/v1"
}
