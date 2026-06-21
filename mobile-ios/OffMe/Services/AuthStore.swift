import Foundation

@MainActor
final class AuthStore: ObservableObject {
    @Published private(set) var session: AuthSession?
    @Published var isLoading = false
    @Published private(set) var isBootstrapping = true

    private let tokenKey = "offme_access_token"
    private let refreshKey = "offme_refresh_token"
    private let userKey = "offme_user_json"

    init() {
        Task { await restoreSession() }
    }

    var accessToken: String? { session?.accessToken }
    var isAuthenticated: Bool { session != nil }

    private func isTokenExpired(_ token: String) -> Bool {
        let parts = token.split(separator: ".")
        guard parts.count >= 2,
              let payloadData = Data(base64Encoded: String(parts[1])
                .replacingOccurrences(of: "-", with: "+")
                .replacingOccurrences(of: "_", with: "/")
                .padding(toLength: ((parts[1].count + 3) / 4) * 4, withPad: "=", startingAt: 0)),
              let json = try? JSONSerialization.jsonObject(with: payloadData) as? [String: Any],
              let exp = json["exp"] as? TimeInterval
        else { return true }
        return Date().timeIntervalSince1970 >= exp - 30
    }

    func restoreSession() async {
        defer { isBootstrapping = false }

        guard
            let refresh = UserDefaults.standard.string(forKey: refreshKey),
            let userData = UserDefaults.standard.data(forKey: userKey),
            let user = try? JSONDecoder().decode(User.self, from: userData)
        else { return }

        if let token = UserDefaults.standard.string(forKey: tokenKey), !isTokenExpired(token) {
            session = AuthSession(accessToken: token, refreshToken: refresh, user: user)
            return
        }

        do {
            let auth = try await APIClient.shared.refreshSession(refreshToken: refresh)
            save(auth)
        } catch {
            logout()
        }
    }

    func save(_ auth: AuthSession) {
        session = auth
        UserDefaults.standard.set(auth.accessToken, forKey: tokenKey)
        UserDefaults.standard.set(auth.refreshToken, forKey: refreshKey)
        if let data = try? JSONEncoder().encode(auth.user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
    }

    func logout() {
        session = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: refreshKey)
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    func login(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        let auth = try await APIClient.shared.login(email: email, password: password)
        save(auth)
    }

    func register(username: String, email: String, password: String, displayName: String) async throws {
        isLoading = true
        defer { isLoading = false }
        let auth = try await APIClient.shared.register(
            username: username,
            email: email,
            password: password,
            displayName: displayName
        )
        save(auth)
    }

    func updateUser(_ user: User) {
        guard let current = session else { return }
        save(AuthSession(
            accessToken: current.accessToken,
            refreshToken: current.refreshToken,
            user: user
        ))
    }
}