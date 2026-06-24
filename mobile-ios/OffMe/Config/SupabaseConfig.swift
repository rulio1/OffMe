import Foundation

enum SupabaseConfig {
    /// URL do Supabase (mesmo projeto usado na web para Realtime)
    static var url: String {
        return EnvironmentConfig.supabaseURL
    }

    /// Chave anônima do Supabase
    static var anonKey: String {
        return EnvironmentConfig.supabaseAnonKey
    }

    static var isConfigured: Bool {
        !url.isEmpty && !anonKey.isEmpty
    }

    static var websocketURL: URL? {
        guard isConfigured else { return nil }
        var components = URLComponents(string: url)!
        components.scheme = "wss"
        components.path = "/realtime/v1/websocket"
        components.queryItems = [
            URLQueryItem(name: "apikey", value: anonKey),
            URLQueryItem(name: "vsn", value: "1.0.0"),
        ]
        return components.url
    }

    /// Configuração de tempo limite para conexões
    static let connectionTimeout: TimeInterval = 30
    static let reconnectionAttempts = 3
    static let reconnectionDelay: TimeInterval = 5
}
