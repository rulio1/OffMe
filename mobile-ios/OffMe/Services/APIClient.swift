import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case unauthorized
    case server(String)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL inválida"
        case .unauthorized: return "Não autenticado"
        case .server(let msg): return msg
        case .decoding(let err): return "Resposta inválida: \(err.localizedDescription)"
        }
    }
}

final class APIClient {
    static let shared = APIClient()
    private let decoder = JSONDecoder()
    private let session: URLSession = {
        let cache = URLCache(memoryCapacity: 20_000_000, diskCapacity: 100_000_000)
        let config = URLSessionConfiguration.default
        config.urlCache = cache
        config.requestCachePolicy = .useProtocolCachePolicy
        return URLSession(configuration: config)
    }()

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil,
        token: String? = nil
    ) async throws -> T {
        guard let url = URL(string: APIConfig.baseURL + path) else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.server("Sem resposta do servidor")
        }

        if http.statusCode == 401 {
            throw APIError.unauthorized
        }

        if !(200...299).contains(http.statusCode) {
            if let errBody = try? decoder.decode(APIErrorBody.self, from: data) {
                throw APIError.server(errBody.message)
            }
            throw APIError.server("Erro HTTP \(http.statusCode)")
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func getURL(path: String, query: [URLQueryItem] = []) throws -> URL {
        var components = URLComponents(string: APIConfig.baseURL + path)!
        if !query.isEmpty { components.queryItems = query }
        guard let url = components.url else { throw APIError.invalidURL }
        return url
    }

    private func getData(url: URL, token: String) async throws -> Data {
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.server("Sem resposta do servidor")
        }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if !(200...299).contains(http.statusCode) {
            if let errBody = try? decoder.decode(APIErrorBody.self, from: data) {
                throw APIError.server(errBody.message)
            }
            throw APIError.server("Erro HTTP \(http.statusCode)")
        }
        return data
    }

    func login(identifier: String, password: String) async throws -> AuthSession {
        struct Body: Encodable {
            let identifier: String
            let email: String
            let password: String
        }
        let value = identifier.trimmingCharacters(in: .whitespaces).lowercased()
        return try await request(
            "/auth/login",
            method: "POST",
            body: Body(identifier: value, email: value, password: password)
        )
    }

    func refreshSession(refreshToken: String) async throws -> AuthSession {
        struct Body: Encodable { let refreshToken: String }
        return try await request("/auth/refresh", method: "POST", body: Body(refreshToken: refreshToken))
    }

    func register(username: String, email: String, password: String, displayName: String) async throws -> AuthSession {
        struct Body: Encodable {
            let username: String
            let email: String
            let password: String
            let displayName: String
        }
        return try await request(
            "/auth/register",
            method: "POST",
            body: Body(username: username, email: email, password: password, displayName: displayName)
        )
    }

    func me(token: String) async throws -> User {
        struct Response: Decodable { let user: User }
        let res: Response = try await request("/auth/me", token: token)
        return res.user
    }

    func createPost(
        text: String,
        token: String,
        replyToId: Int? = nil,
        mediaIds: [String]? = nil
    ) async throws -> Post {
        struct Body: Encodable {
            let text: String
            let replyToId: Int?
            let mediaIds: [String]?
        }
        return try await request(
            "/posts",
            method: "POST",
            body: Body(text: text, replyToId: replyToId, mediaIds: mediaIds),
            token: token
        )
    }

    func uploadImage(data: Data, mimeType: String, filename: String, token: String) async throws -> UploadedMedia {
        let boundary = "Boundary-\(UUID().uuidString)"
        guard let url = URL(string: APIConfig.baseURL + "/media/upload") else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.appendMultipartField(
            boundary: boundary,
            name: "file",
            filename: filename,
            mimeType: mimeType,
            data: data
        )
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (responseData, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.server("Sem resposta do servidor")
        }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if !(200...299).contains(http.statusCode) {
            if let errBody = try? decoder.decode(APIErrorBody.self, from: responseData) {
                throw APIError.server(errBody.message)
            }
            throw APIError.server("Erro HTTP \(http.statusCode)")
        }
        return try decoder.decode(UploadedMedia.self, from: responseData)
    }

    func fetchPost(postId: Int, token: String) async throws -> Post {
        try await request("/posts/\(postId)", token: token)
    }

    func fetchPostReplies(postId: Int, token: String, cursor: String? = nil) async throws -> TimelineResponse {
        var query: [URLQueryItem] = []
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        let url = try getURL(path: "/posts/\(postId)/replies", query: query)
        let data = try await getData(url: url, token: token)
        return try decoder.decode(TimelineResponse.self, from: data)
    }

    func forYouTimeline(token: String, cursor: String? = nil) async throws -> TimelineResponse {
        var query: [URLQueryItem] = []
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        let url = try getURL(path: "/timeline/for-you", query: query)
        let data = try await getData(url: url, token: token)
        return try decoder.decode(TimelineResponse.self, from: data)
    }

    func homeTimeline(token: String, cursor: String? = nil) async throws -> TimelineResponse {
        var query: [URLQueryItem] = []
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        let url = try getURL(path: "/timeline/home", query: query)
        let data = try await getData(url: url, token: token)
        return try decoder.decode(TimelineResponse.self, from: data)
    }

    func searchUsers(query: String, token: String) async throws -> [User] {
        let url = try getURL(path: "/users/search", query: [URLQueryItem(name: "q", value: query)])
        let data = try await getData(url: url, token: token)
        let res = try decoder.decode(SearchUsersResponse.self, from: data)
        return res.users
    }

    func searchPosts(query: String, token: String) async throws -> [Post] {
        let url = try getURL(path: "/posts/search", query: [URLQueryItem(name: "q", value: query)])
        let data = try await getData(url: url, token: token)
        let res = try decoder.decode(SearchPostsResponse.self, from: data)
        return res.posts
    }

    func fetchTrendingPosts(token: String) async throws -> [Post] {
        let url = try getURL(path: "/posts/search", query: [URLQueryItem(name: "trending", value: "1")])
        let data = try await getData(url: url, token: token)
        let res = try decoder.decode(SearchPostsResponse.self, from: data)
        return res.posts
    }

    func deletePost(postId: Int, token: String) async throws {
        guard let url = URL(string: APIConfig.baseURL + "/posts/\(postId)") else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.server("Sem resposta do servidor")
        }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if !(200...299).contains(http.statusCode) {
            if let errBody = try? decoder.decode(APIErrorBody.self, from: data) {
                throw APIError.server(errBody.message)
            }
            throw APIError.server("Erro HTTP \(http.statusCode)")
        }
    }

    func userProfile(username: String, token: String) async throws -> ProfileResponse {
        let encoded = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? username
        return try await request("/users/\(encoded)", token: token)
    }

    func userPosts(username: String, token: String) async throws -> TimelineResponse {
        let encoded = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? username
        return try await request("/users/\(encoded)/posts", token: token)
    }

    func updateProfile(
        token: String,
        displayName: String?,
        bio: String?,
        avatarUrl: String?,
        bannerUrl: String? = nil,
        location: String? = nil,
        websiteUrl: String? = nil
    ) async throws -> User {
        struct Body: Encodable {
            let displayName: String?
            let bio: String?
            let avatarUrl: String?
            let bannerUrl: String?
            let location: String?
            let websiteUrl: String?
        }
        let res: UpdateUserResponse = try await request(
            "/users/me",
            method: "PATCH",
            body: Body(
                displayName: displayName,
                bio: bio,
                avatarUrl: avatarUrl,
                bannerUrl: bannerUrl,
                location: location,
                websiteUrl: websiteUrl
            ),
            token: token
        )
        return res.user
    }

    func fetchNotifications(token: String) async throws -> NotificationsResponse {
        try await request("/notifications", token: token)
    }

    func markNotificationsRead(token: String) async throws {
        struct Ok: Decodable { let ok: Bool? }
        let _: Ok = try await request("/notifications", method: "PATCH", token: token)
    }

    func followUser(username: String, token: String) async throws -> User {
        let encoded = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? username
        let res: FollowUserResponse = try await request("/users/\(encoded)/follow", method: "POST", token: token)
        return res.user
    }

    func unfollowUser(username: String, token: String) async throws -> User {
        let encoded = username.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? username
        let res: FollowUserResponse = try await request("/users/\(encoded)/follow", method: "DELETE", token: token)
        return res.user
    }

    func likePost(postId: Int, token: String) async throws -> LikePostResponse {
        try await request("/posts/\(postId)/like", method: "POST", token: token)
    }

    func unlikePost(postId: Int, token: String) async throws -> LikePostResponse {
        try await request("/posts/\(postId)/like", method: "DELETE", token: token)
    }

    func repostPost(postId: Int, token: String) async throws -> RepostPostResponse {
        try await request("/posts/\(postId)/repost", method: "POST", token: token)
    }

    func unrepostPost(postId: Int, token: String) async throws -> RepostPostResponse {
        try await request("/posts/\(postId)/repost", method: "DELETE", token: token)
    }

    func bookmarkPost(postId: Int, token: String) async throws -> BookmarkPostResponse {
        try await request("/posts/\(postId)/bookmark", method: "POST", token: token)
    }

    func unbookmarkPost(postId: Int, token: String) async throws -> BookmarkPostResponse {
        try await request("/posts/\(postId)/bookmark", method: "DELETE", token: token)
    }

    func fetchBookmarks(token: String, cursor: String? = nil) async throws -> TimelineResponse {
        var query: [URLQueryItem] = []
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        let url = try getURL(path: "/bookmarks", query: query)
        let data = try await getData(url: url, token: token)
        return try decoder.decode(TimelineResponse.self, from: data)
    }

    func fetchConversations(token: String) async throws -> [ConversationSummary] {
        let res: ConversationsResponse = try await request("/conversations", token: token)
        return res.conversations
    }

    func startConversation(username: String, token: String) async throws -> ConversationSummary {
        struct Body: Encodable { let username: String }
        let res: StartConversationResponse = try await request(
            "/conversations",
            method: "POST",
            body: Body(username: username),
            token: token
        )
        return res.conversation
    }

    func fetchMessages(conversationId: Int, token: String) async throws -> [DirectMessage] {
        let res: MessagesResponse = try await request(
            "/conversations/\(conversationId)/messages",
            token: token
        )
        return res.messages
    }

    func sendDirectMessage(conversationId: Int, text: String, token: String) async throws -> DirectMessage {
        struct Body: Encodable { let text: String }
        return try await request(
            "/conversations/\(conversationId)/messages",
            method: "POST",
            body: Body(text: text),
            token: token
        )
    }

    func fetchVerificationStatus(token: String) async throws -> VerificationStatusResponse {
        try await request("/verification/request", token: token)
    }

    func submitVerificationRequest(reason: String, token: String) async throws {
        struct Body: Encodable { let reason: String }
        struct Ok: Decodable { let ok: Bool? }
        let _: Ok = try await request(
            "/verification/request",
            method: "POST",
            body: Body(reason: reason),
            token: token
        )
    }

    func registerPushToken(token: String, platform: String, authToken: String) async throws {
        struct Body: Encodable {
            let platform: String
            let token: String
        }
        struct Ok: Decodable { let registered: Bool? }
        let _: Ok = try await request(
            "/push/register",
            method: "POST",
            body: Body(platform: platform, token: token),
            token: authToken
        )
    }

    func fetchLists(token: String) async throws -> [OffMeList] {
        struct Response: Decodable { let lists: [OffMeList] }
        let res: Response = try await request("/lists", token: token)
        return res.lists
    }

    func createList(name: String, token: String) async throws -> OffMeList {
        struct Body: Encodable {
            let name: String
            let isPrivate: Bool
        }
        return try await request("/lists", method: "POST", body: Body(name: name, isPrivate: false), token: token)
    }

    func fetchCommunities(token: String) async throws -> [OffMeCommunity] {
        struct Response: Decodable { let communities: [OffMeCommunity] }
        let res: Response = try await request("/communities", token: token)
        return res.communities
    }

    func createCommunity(name: String, token: String) async throws -> OffMeCommunity {
        struct Body: Encodable { let name: String }
        return try await request("/communities", method: "POST", body: Body(name: name), token: token)
    }
}

private extension Data {
    mutating func appendMultipartField(
        boundary: String,
        name: String,
        filename: String,
        mimeType: String,
        data: Data
    ) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        append(data)
        append("\r\n".data(using: .utf8)!)
    }
}

private struct AnyEncodable: Encodable {
    private let encodeFunc: (Encoder) throws -> Void
    init(_ wrapped: Encodable) {
        encodeFunc = wrapped.encode
    }
    func encode(to encoder: Encoder) throws {
        try encodeFunc(encoder)
    }
}