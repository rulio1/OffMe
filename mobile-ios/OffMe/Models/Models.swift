import Foundation

struct User: Codable, Identifiable, Hashable {
    let id: Int
    let username: String
    let displayName: String
    let avatarUrl: String?
    let bannerUrl: String?
    let verified: Bool
    let isOfficial: Bool
    let bio: String?
    let location: String?
    let websiteUrl: String?
    let followerCount: Int?
    let followingCount: Int?
    let isFollowing: Bool?

    enum CodingKeys: String, CodingKey {
        case id, username, displayName, avatarUrl, bannerUrl, verified, isOfficial, bio, location, websiteUrl
        case followerCount, followingCount, isFollowing
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try FlexibleDecoding.int(from: c, forKey: .id)
        username = try c.decode(String.self, forKey: .username)
        displayName = (try? c.decode(String.self, forKey: .displayName)) ?? username
        avatarUrl = FlexibleDecoding.stringIfPresent(from: c, forKey: .avatarUrl)
        bannerUrl = FlexibleDecoding.stringIfPresent(from: c, forKey: .bannerUrl)
        verified = FlexibleDecoding.boolIfPresent(from: c, forKey: .verified) ?? false
        isOfficial = OfficialProfiles.isOfficial(username: username)
        bio = FlexibleDecoding.stringIfPresent(from: c, forKey: .bio)
        location = FlexibleDecoding.stringIfPresent(from: c, forKey: .location)
        websiteUrl = FlexibleDecoding.stringIfPresent(from: c, forKey: .websiteUrl)
        followerCount = FlexibleDecoding.intIfPresent(from: c, forKey: .followerCount)
        followingCount = FlexibleDecoding.intIfPresent(from: c, forKey: .followingCount)
        isFollowing = FlexibleDecoding.boolIfPresent(from: c, forKey: .isFollowing)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(username, forKey: .username)
        try c.encode(displayName, forKey: .displayName)
        try c.encodeIfPresent(avatarUrl, forKey: .avatarUrl)
        try c.encodeIfPresent(bannerUrl, forKey: .bannerUrl)
        try c.encode(verified, forKey: .verified)
        try c.encode(isOfficial, forKey: .isOfficial)
        try c.encodeIfPresent(bio, forKey: .bio)
        try c.encodeIfPresent(location, forKey: .location)
        try c.encodeIfPresent(websiteUrl, forKey: .websiteUrl)
        try c.encodeIfPresent(followerCount, forKey: .followerCount)
        try c.encodeIfPresent(followingCount, forKey: .followingCount)
        try c.encodeIfPresent(isFollowing, forKey: .isFollowing)
    }

    func with(isFollowing: Bool) -> User {
        with(displayName: displayName, bio: bio, avatarUrl: avatarUrl, bannerUrl: bannerUrl, isFollowing: isFollowing)
    }

    func with(
        displayName: String? = nil,
        bio: String? = nil,
        location: String? = nil,
        websiteUrl: String? = nil,
        avatarUrl: String?? = nil,
        bannerUrl: String?? = nil,
        isFollowing: Bool? = nil
    ) -> User {
        User(
            id: id,
            username: username,
            displayName: displayName ?? self.displayName,
            avatarUrl: avatarUrl ?? self.avatarUrl,
            bannerUrl: bannerUrl ?? self.bannerUrl,
            verified: verified,
            isOfficial: isOfficial,
            bio: bio ?? self.bio,
            location: location ?? self.location,
            websiteUrl: websiteUrl ?? self.websiteUrl,
            followerCount: followerCount,
            followingCount: followingCount,
            isFollowing: isFollowing ?? self.isFollowing
        )
    }

    private init(
        id: Int,
        username: String,
        displayName: String,
        avatarUrl: String?,
        bannerUrl: String?,
        verified: Bool,
        isOfficial: Bool,
        bio: String?,
        location: String?,
        websiteUrl: String?,
        followerCount: Int?,
        followingCount: Int?,
        isFollowing: Bool?
    ) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.avatarUrl = avatarUrl
        self.bannerUrl = bannerUrl
        self.verified = verified
        self.isOfficial = isOfficial
        self.bio = bio
        self.location = location
        self.websiteUrl = websiteUrl
        self.followerCount = followerCount
        self.followingCount = followingCount
        self.isFollowing = isFollowing
    }
}

enum OfficialProfiles {
    static let profiles: [String: [String: String]] = [
        "offme": [
            "displayName": "OffMe",
            "bio": "Bem-vindo ao OffMe! A rede social mais autêntica.",
            "avatarUrl": "/brand/offme-official-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Brasil"
        ],
        "betateam": [
            "displayName": "Beta Team",
            "bio": "Equipe Beta do OffMe · novidades, suporte e testes.",
            "avatarUrl": "/brand/beta-team-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Global"
        ],
        "beta": [
            "displayName": "OffMe Beta",
            "bio": "Programa Beta do OffMe · seja um testador.",
            "avatarUrl": "/brand/beta-team-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Global"
        ],
        "support": [
            "displayName": "OffMe Suporte",
            "bio": "Suporte oficial do OffMe.",
            "avatarUrl": "/brand/offme-official-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Brasil"
        ],
        "safety": [
            "displayName": "OffMe Segurança",
            "bio": "Segurança e confiança no OffMe.",
            "avatarUrl": "/brand/offme-official-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Global"
        ],
        "tips": [
            "displayName": "OffMe Dicas",
            "bio": "Dicas e tutoriais para usar o OffMe.",
            "avatarUrl": "/brand/offme-official-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Global"
        ],
        "news": [
            "displayName": "OffMe Notícias",
            "bio": "Novidades e atualizações do OffMe.",
            "avatarUrl": "/brand/offme-official-avatar.png",
            "bannerUrl": "/brand/offme-banner.png",
            "location": "Global"
        ]
    ]

    static func isOfficial(username: String) -> Bool {
        profiles[username.lowercased()] != nil
    }
}

struct AuthSession: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
}

struct UploadedMedia: Codable {
    let id: String
    let url: String
    let mimeType: String
    let fileSizeBytes: Int
}

struct Post: Codable, Identifiable, Hashable {
    let id: Int
    let authorId: Int
    let author: User?
    let text: String
    let createdAt: Int64
    let likeCount: Int
    let repostCount: Int
    let replyCount: Int
    let replyToId: Int?
    let likedByMe: Bool?
    let bookmarkedByMe: Bool?
    let repostedByMe: Bool?
    let mediaUrls: [String]?
    let timelineSource: String?

    enum CodingKeys: String, CodingKey {
        case id, authorId, author, text, createdAt
        case likeCount, repostCount, replyCount, replyToId, likedByMe
        case bookmarkedByMe, repostedByMe, mediaUrls, timelineSource
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try FlexibleDecoding.int(from: c, forKey: .id)
        authorId = FlexibleDecoding.intIfPresent(from: c, forKey: .authorId) ?? 0
        author = try c.decodeIfPresent(User.self, forKey: .author)
        text = try c.decode(String.self, forKey: .text)
        createdAt = try FlexibleDecoding.int64(from: c, forKey: .createdAt)
        likeCount = FlexibleDecoding.intIfPresent(from: c, forKey: .likeCount) ?? 0
        repostCount = FlexibleDecoding.intIfPresent(from: c, forKey: .repostCount) ?? 0
        replyCount = FlexibleDecoding.intIfPresent(from: c, forKey: .replyCount) ?? 0
        replyToId = FlexibleDecoding.intIfPresent(from: c, forKey: .replyToId)
        likedByMe = FlexibleDecoding.boolIfPresent(from: c, forKey: .likedByMe)
        bookmarkedByMe = FlexibleDecoding.boolIfPresent(from: c, forKey: .bookmarkedByMe)
        repostedByMe = FlexibleDecoding.boolIfPresent(from: c, forKey: .repostedByMe)
        mediaUrls = try c.decodeIfPresent([String].self, forKey: .mediaUrls)
        timelineSource = try c.decodeIfPresent(String.self, forKey: .timelineSource)
    }
}

struct TimelineEntry: Codable, Identifiable, Hashable {
    var id: Int { postId }
    let postId: Int
    let authorId: Int
    let source: String
    let createdAt: Int64
    let post: Post?

    enum CodingKeys: String, CodingKey {
        case postId, authorId, source, createdAt, post
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        postId = try FlexibleDecoding.int(from: c, forKey: .postId)
        authorId = try FlexibleDecoding.int(from: c, forKey: .authorId)
        source = (try? c.decode(String.self, forKey: .source)) ?? "recommended"
        createdAt = try FlexibleDecoding.int64(from: c, forKey: .createdAt)
        post = try c.decodeIfPresent(Post.self, forKey: .post)
    }
}

struct TimelineResponse: Codable {
    let entries: [TimelineEntry]
    let nextCursor: String?
}

struct ProfileResponse: Codable {
    let user: User
    let isOwnProfile: Bool
}

struct SearchUsersResponse: Codable {
    let users: [User]
}

struct SearchPostsResponse: Codable {
    let posts: [Post]
    let trending: Bool?
}

struct FollowUserResponse: Codable {
    let user: User
}

struct LikePostResponse: Codable {
    let postId: Int
    let likeCount: Int
    let likedByMe: Bool
}

struct RepostPostResponse: Codable {
    let postId: Int
    let repostCount: Int
    let repostedByMe: Bool
}

struct BookmarkPostResponse: Codable {
    let postId: Int
    let bookmarkedByMe: Bool
}

struct ConversationSummary: Codable, Identifiable, Hashable {
    let id: Int
    let participant: User
    let updatedAt: Int64
    let lastMessage: ConversationLastMessage?

    enum CodingKeys: String, CodingKey {
        case id, participant, updatedAt, lastMessage
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if let intId = try? c.decode(Int.self, forKey: .id) {
            id = intId
        } else if let strId = try? c.decode(String.self, forKey: .id), let parsed = Int(strId) {
            id = parsed
        } else {
            throw DecodingError.dataCorruptedError(forKey: .id, in: c, debugDescription: "Invalid id")
        }
        participant = try c.decode(User.self, forKey: .participant)
        updatedAt = try c.decode(Int64.self, forKey: .updatedAt)
        lastMessage = try c.decodeIfPresent(ConversationLastMessage.self, forKey: .lastMessage)
    }
}

struct ConversationLastMessage: Codable, Hashable {
    let text: String
    let createdAt: Int64
    let senderId: Int
}

struct ConversationsResponse: Codable {
    let conversations: [ConversationSummary]
}

struct StartConversationResponse: Codable {
    let conversation: ConversationSummary
}

struct DirectMessage: Codable, Identifiable, Hashable {
    let id: Int
    let conversationId: Int
    let senderId: Int
    let text: String
    let createdAt: Int64
    let isMine: Bool?

    enum CodingKeys: String, CodingKey {
        case id, conversationId, senderId, text, createdAt, isMine
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if let intId = try? c.decode(Int.self, forKey: .id) {
            id = intId
        } else if let strId = try? c.decode(String.self, forKey: .id), let parsed = Int(strId) {
            id = parsed
        } else {
            throw DecodingError.dataCorruptedError(forKey: .id, in: c, debugDescription: "Invalid id")
        }
        conversationId = try c.decode(Int.self, forKey: .conversationId)
        senderId = try c.decode(Int.self, forKey: .senderId)
        text = try c.decode(String.self, forKey: .text)
        createdAt = try FlexibleDecoding.int64(from: c, forKey: .createdAt)
        isMine = try c.decodeIfPresent(Bool.self, forKey: .isMine)
    }
}

struct MessagesResponse: Codable {
    let messages: [DirectMessage]
    let nextCursor: String?
}

struct AppNotification: Codable, Identifiable {
    let id: Int
    let type: String
    let postId: Int?
    let read: Bool
    let createdAt: Int64
    let actor: User

    enum CodingKeys: String, CodingKey {
        case id, type, postId, read, createdAt, actor
    }

    init(
        id: Int,
        type: String,
        postId: Int?,
        read: Bool,
        createdAt: Int64,
        actor: User
    ) {
        self.id = id
        self.type = type
        self.postId = postId
        self.read = read
        self.createdAt = createdAt
        self.actor = actor
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try FlexibleDecoding.int(from: c, forKey: .id)
        type = try c.decode(String.self, forKey: .type)
        postId = FlexibleDecoding.intIfPresent(from: c, forKey: .postId)
        read = FlexibleDecoding.boolIfPresent(from: c, forKey: .read) ?? false
        createdAt = try FlexibleDecoding.int64(from: c, forKey: .createdAt)
        actor = try c.decode(User.self, forKey: .actor)
    }
}

struct NotificationsResponse: Codable {
    let notifications: [AppNotification]
    let unreadCount: Int
}

struct UpdateUserResponse: Codable {
    let user: User
}

struct APIErrorBody: Codable {
    let message: String
}

struct VerificationRequestInfo: Codable {
    let id: Int?
    let status: String
    let reason: String?
    let createdAt: Int64?
}

struct VerificationStatusResponse: Codable {
    let request: VerificationRequestInfo?
    let verified: Bool?
}

struct OffMeList: Codable, Identifiable {
    let id: Int
    let ownerId: Int
    let name: String
    let description: String?
    let isPrivate: Bool
    let memberCount: Int
    let createdAt: Int64

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try FlexibleDecoding.int(from: c, forKey: .id)
        ownerId = try FlexibleDecoding.int(from: c, forKey: .ownerId)
        name = try c.decode(String.self, forKey: .name)
        description = FlexibleDecoding.stringIfPresent(from: c, forKey: .description)
        isPrivate = FlexibleDecoding.boolIfPresent(from: c, forKey: .isPrivate) ?? false
        memberCount = FlexibleDecoding.intIfPresent(from: c, forKey: .memberCount) ?? 0
        createdAt = try FlexibleDecoding.int64(from: c, forKey: .createdAt)
    }

    enum CodingKeys: String, CodingKey {
        case id, ownerId, name, description, isPrivate, memberCount, createdAt
    }
}

struct OffMeCommunity: Codable, Identifiable {
    let id: Int
    let slug: String
    let name: String
    let description: String?
    let creatorId: Int?
    let memberCount: Int
    let createdAt: Int64

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try FlexibleDecoding.int(from: c, forKey: .id)
        slug = try c.decode(String.self, forKey: .slug)
        name = try c.decode(String.self, forKey: .name)
        description = FlexibleDecoding.stringIfPresent(from: c, forKey: .description)
        creatorId = FlexibleDecoding.intIfPresent(from: c, forKey: .creatorId)
        memberCount = FlexibleDecoding.intIfPresent(from: c, forKey: .memberCount) ?? 0
        createdAt = try FlexibleDecoding.int64(from: c, forKey: .createdAt)
    }

    enum CodingKeys: String, CodingKey {
        case id, slug, name, description, creatorId, memberCount, createdAt
    }
}

enum Formatters {
    static func count(_ n: Int) -> String {
        if n >= 1_000_000 { return String(format: "%.1fM", Double(n) / 1_000_000) }
        if n >= 1_000 { return String(format: "%.1fK", Double(n) / 1_000) }
        return "\(n)"
    }
}