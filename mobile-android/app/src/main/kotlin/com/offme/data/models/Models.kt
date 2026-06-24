package com.offme.data.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: Int = 0,
    val username: String = "",
    @SerializedName("displayName") val displayName: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("bannerUrl") val bannerUrl: String? = null,
    val verified: Boolean = false,
    val isOfficial: Boolean = false,
    val bio: String? = null,
    val location: String? = null,
    @SerializedName("websiteUrl") val websiteUrl: String? = null,
    @SerializedName("followerCount") val followerCount: Int? = null,
    @SerializedName("followingCount") val followingCount: Int? = null,
    @SerializedName("isFollowing") val isFollowing: Boolean? = null,
) {
    val resolvedDisplayName: String get() = displayName?.takeIf { it.isNotBlank() } ?: username

    val official: User get() = OfficialProfiles.enrich(this)
}

object OfficialProfiles {
    private val profiles: Map<String, Map<String, String>> = mapOf(
        "offme" to mapOf(
            "displayName" to "OffMe",
            "bio" to "Bem-vindo ao OffMe! A rede social mais autêntica.",
            "avatarUrl" to "/brand/offme-official-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Brasil"
        ),
        "offme_beta" to mapOf(
            "displayName" to "OffMe Beta",
            "bio" to "Programa Beta do OffMe · seja um testador.",
            "avatarUrl" to "/brand/beta-team-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Global"
        ),
        "offme_tips" to mapOf(
            "displayName" to "OffMe Dicas",
            "bio" to "Dicas e tutoriais para usar o OffMe.",
            "avatarUrl" to "/brand/offme-official-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Global"
        ),
        "offme_news" to mapOf(
            "displayName" to "OffMe Notícias",
            "bio" to "Novidades e atualizações do OffMe.",
            "avatarUrl" to "/brand/offme-official-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Global"
        ),
        "betateam" to mapOf(
            "displayName" to "Beta Team",
            "bio" to "Equipe Beta do OffMe · novidades, suporte e testes.",
            "avatarUrl" to "/brand/beta-team-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Global"
        ),
        "beta" to mapOf(
            "displayName" to "OffMe Beta",
            "bio" to "Programa Beta do OffMe · seja um testador.",
            "avatarUrl" to "/brand/beta-team-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Global"
        ),
        "support" to mapOf(
            "displayName" to "OffMe Suporte",
            "bio" to "Suporte oficial do OffMe.",
            "avatarUrl" to "/brand/offme-official-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Brasil"
        ),
        "safety" to mapOf(
            "displayName" to "OffMe Segurança",
            "bio" to "Segurança e confiança no OffMe.",
            "avatarUrl" to "/brand/offme-official-avatar.png",
            "bannerUrl" to "/brand/offme-banner.png",
            "location" to "Global"
        )
    )

    fun isOfficial(username: String): Boolean = profiles.containsKey(username.lowercase())

    fun enrich(user: User): User {
        val data = profiles[user.username.lowercase()] ?: return user
        return user.copy(
            displayName = data["displayName"] ?: user.displayName,
            avatarUrl = data["avatarUrl"] ?: user.avatarUrl,
            bannerUrl = data["bannerUrl"] ?: user.bannerUrl,
            verified = true,
            isOfficial = true,
            bio = data["bio"] ?: user.bio,
            location = data["location"] ?: user.location
        )
    }
}

data class AuthSession(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("refreshToken") val refreshToken: String,
    val user: User,
)

data class Post(
    val id: Int = 0,
    @SerializedName("authorId") val authorId: Int = 0,
    val author: User? = null,
    val text: String = "",
    @SerializedName("createdAt") val createdAt: Long = 0L,
    @SerializedName("likeCount") val likeCount: Int = 0,
    @SerializedName("repostCount") val repostCount: Int = 0,
    @SerializedName("replyCount") val replyCount: Int = 0,
    @SerializedName("replyToId") val replyToId: Int? = null,
    @SerializedName("likedByMe") val likedByMe: Boolean? = null,
    @SerializedName("bookmarkedByMe") val bookmarkedByMe: Boolean? = null,
    @SerializedName("repostedByMe") val repostedByMe: Boolean? = null,
    @SerializedName("mediaUrls") val mediaUrls: List<String>? = null,
    @SerializedName("timelineSource") val timelineSource: String? = null,
)

data class TimelineEntry(
    @SerializedName("postId") val postId: Int = 0,
    @SerializedName("authorId") val authorId: Int = 0,
    val source: String = "recommended",
    @SerializedName("createdAt") val createdAt: Long = 0L,
    val post: Post? = null,
)

data class TimelineResponse(
    val entries: List<TimelineEntry> = emptyList(),
    @SerializedName("nextCursor") val nextCursor: String? = null,
)

data class ProfileResponse(
    val user: User,
    @SerializedName("isOwnProfile") val isOwnProfile: Boolean = false,
)

data class SearchUsersResponse(
    val users: List<User> = emptyList(),
)

data class SearchPostsResponse(
    val posts: List<Post> = emptyList(),
)

data class UpdateProfileBody(
    @SerializedName("displayName") val displayName: String? = null,
    val bio: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("bannerUrl") val bannerUrl: String? = null,
    val location: String? = null,
    @SerializedName("websiteUrl") val websiteUrl: String? = null,
)

data class FollowUserResponse(
    val user: User,
)

data class LikePostResponse(
    @SerializedName("postId") val postId: Int,
    @SerializedName("likeCount") val likeCount: Int,
    @SerializedName("likedByMe") val likedByMe: Boolean,
)

data class RepostPostResponse(
    @SerializedName("postId") val postId: Int,
    @SerializedName("repostCount") val repostCount: Int,
    @SerializedName("repostedByMe") val repostedByMe: Boolean,
)

data class BookmarkPostResponse(
    @SerializedName("postId") val postId: Int,
    @SerializedName("bookmarkedByMe") val bookmarkedByMe: Boolean,
)

data class ConversationLastMessage(
    val text: String,
    @SerializedName("createdAt") val createdAt: Long,
    @SerializedName("senderId") val senderId: Int,
)

data class ConversationSummary(
    val id: Int = 0,
    val participant: User,
    @SerializedName("updatedAt") val updatedAt: Long = 0L,
    @SerializedName("lastMessage") val lastMessage: ConversationLastMessage? = null,
)

data class ConversationsResponse(
    val conversations: List<ConversationSummary> = emptyList(),
)

data class StartConversationResponse(
    val conversation: ConversationSummary,
)

data class DirectMessage(
    val id: Int = 0,
    @SerializedName("conversationId") val conversationId: Int = 0,
    @SerializedName("senderId") val senderId: Int = 0,
    val text: String = "",
    @SerializedName("createdAt") val createdAt: Long = 0L,
    @SerializedName("isMine") val isMine: Boolean? = null,
)

data class MessagesResponse(
    val messages: List<DirectMessage> = emptyList(),
    @SerializedName("nextCursor") val nextCursor: String? = null,
)

data class AppNotification(
    val id: Int = 0,
    val type: String = "",
    @SerializedName("postId") val postId: Int? = null,
    val read: Boolean = false,
    @SerializedName("createdAt") val createdAt: Long = 0L,
    val actor: User,
) {
    val message: String
        get() = when (type) {
            "like" -> "curtiu seu post"
            "reply" -> "respondeu seu post"
            "follow" -> "começou a seguir você"
            "repost" -> "repostou seu post"
            else -> "interagiu com você"
        }
}

data class NotificationsResponse(
    val notifications: List<AppNotification> = emptyList(),
    @SerializedName("unreadCount") val unreadCount: Int = 0,
)

data class MeResponse(
    val user: User,
)

data class UpdateUserResponse(
    val user: User,
)

data class ApiErrorBody(
    val message: String? = null,
)

data class CreatePostBody(
    val text: String,
    @SerializedName("replyToId") val replyToId: Int? = null,
    @SerializedName("mediaIds") val mediaIds: List<String>? = null,
    @SerializedName("communityId") val communityId: Int? = null,
    @SerializedName("scheduledAt") val scheduledAt: String? = null,
)

data class ReportUserBody(
    val reason: String = "abuse",
)

data class LoginBody(
    val identifier: String,
    val email: String,
    val password: String,
)

data class RegisterBody(
    val username: String,
    val email: String,
    val password: String,
    @SerializedName("displayName") val displayName: String,
)

data class RefreshBody(
    @SerializedName("refreshToken") val refreshToken: String,
)

data class StartConversationBody(
    val username: String,
)

data class SendMessageBody(
    val text: String,
)