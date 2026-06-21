import Foundation

enum SupabaseConfig {
    /// Mesmo projeto do Supabase usado na web (Realtime).
    static let url = "https://mojmkhuafptpvwrprxqg.supabase.co"
    static let anonKey = "sb_publishable__3x5fSHfdWSMtQ3xAKNB9A_u25kjxIA"

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
}