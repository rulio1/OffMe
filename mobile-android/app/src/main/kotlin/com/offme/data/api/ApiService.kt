package com.offme.data.api

import com.offme.data.models.AuthSession
import com.offme.data.models.BookmarkPostResponse
import com.offme.data.models.ConversationsResponse
import com.offme.data.models.CreatePostBody
import com.offme.data.models.DirectMessage
import com.offme.data.models.FollowUserResponse
import com.offme.data.models.LikePostResponse
import com.offme.data.models.LoginBody
import com.offme.data.models.MeResponse
import com.offme.data.models.MessagesResponse
import com.offme.data.models.NotificationsResponse
import com.offme.data.models.Post
import com.offme.data.models.ProfileResponse
import com.offme.data.models.RefreshBody
import com.offme.data.models.RegisterBody
import com.offme.data.models.ReportUserBody
import com.offme.data.models.RepostPostResponse
import com.offme.data.models.SearchPostsResponse
import com.offme.data.models.SearchUsersResponse
import com.offme.data.models.SendMessageBody
import com.offme.data.models.StartConversationBody
import com.offme.data.models.StartConversationResponse
import com.offme.data.models.TimelineResponse
import com.offme.data.models.UpdateProfileBody
import com.offme.data.models.UpdateUserResponse
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: LoginBody): AuthSession

    @POST("auth/register")
    suspend fun register(@Body body: RegisterBody): AuthSession

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshBody): AuthSession

    @GET("auth/me")
    suspend fun me(@Header("Authorization") token: String): MeResponse

    @GET("timeline/for-you")
    suspend fun forYouTimeline(
        @Header("Authorization") token: String,
        @Query("cursor") cursor: String? = null,
    ): TimelineResponse

    @GET("timeline/home")
    suspend fun homeTimeline(
        @Header("Authorization") token: String,
        @Query("cursor") cursor: String? = null,
    ): TimelineResponse

    @POST("posts")
    suspend fun createPost(
        @Header("Authorization") token: String,
        @Body body: CreatePostBody,
    ): Post

    @POST("users/{username}/report")
    suspend fun reportUser(
        @Header("Authorization") token: String,
        @Path("username") username: String,
        @Body body: ReportUserBody,
    ): Map<String, Any?>

    @GET("posts/{postId}")
    suspend fun fetchPost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): Post

    @GET("posts/{postId}/replies")
    suspend fun fetchPostReplies(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
        @Query("cursor") cursor: String? = null,
    ): TimelineResponse

    @DELETE("posts/{postId}")
    suspend fun deletePost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): Map<String, Any?>

    @GET("posts/search")
    suspend fun searchPosts(
        @Header("Authorization") token: String,
        @Query("q") query: String,
    ): SearchPostsResponse

    @GET("posts/search")
    suspend fun fetchTrendingPosts(
        @Header("Authorization") token: String,
        @Query("trending") trending: String = "1",
    ): SearchPostsResponse

    @POST("posts/{postId}/like")
    suspend fun likePost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): LikePostResponse

    @DELETE("posts/{postId}/like")
    suspend fun unlikePost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): LikePostResponse

    @POST("posts/{postId}/repost")
    suspend fun repostPost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): RepostPostResponse

    @DELETE("posts/{postId}/repost")
    suspend fun unrepostPost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): RepostPostResponse

    @POST("posts/{postId}/bookmark")
    suspend fun bookmarkPost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): BookmarkPostResponse

    @DELETE("posts/{postId}/bookmark")
    suspend fun unbookmarkPost(
        @Header("Authorization") token: String,
        @Path("postId") postId: Int,
    ): BookmarkPostResponse

    @GET("bookmarks")
    suspend fun fetchBookmarks(
        @Header("Authorization") token: String,
        @Query("cursor") cursor: String? = null,
    ): TimelineResponse

    @GET("users/search")
    suspend fun searchUsers(
        @Header("Authorization") token: String,
        @Query("q") query: String,
    ): SearchUsersResponse

    @GET("users/{username}")
    suspend fun userProfile(
        @Header("Authorization") token: String,
        @Path("username") username: String,
    ): ProfileResponse

    @PATCH("users/me")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body body: UpdateProfileBody,
    ): UpdateUserResponse

    @GET("users/{username}/posts")
    suspend fun userPosts(
        @Header("Authorization") token: String,
        @Path("username") username: String,
    ): TimelineResponse

    @POST("users/{username}/follow")
    suspend fun followUser(
        @Header("Authorization") token: String,
        @Path("username") username: String,
    ): FollowUserResponse

    @DELETE("users/{username}/follow")
    suspend fun unfollowUser(
        @Header("Authorization") token: String,
        @Path("username") username: String,
    ): FollowUserResponse

    @GET("notifications")
    suspend fun fetchNotifications(@Header("Authorization") token: String): NotificationsResponse

    @PATCH("notifications")
    suspend fun markNotificationsRead(@Header("Authorization") token: String): Map<String, Any?>

    @GET("conversations")
    suspend fun fetchConversations(@Header("Authorization") token: String): ConversationsResponse

    @POST("conversations")
    suspend fun startConversation(
        @Header("Authorization") token: String,
        @Body body: StartConversationBody,
    ): StartConversationResponse

    @GET("conversations/{conversationId}/messages")
    suspend fun fetchMessages(
        @Header("Authorization") token: String,
        @Path("conversationId") conversationId: Int,
    ): MessagesResponse

    @POST("conversations/{conversationId}/messages")
    suspend fun sendMessage(
        @Header("Authorization") token: String,
        @Path("conversationId") conversationId: Int,
        @Body body: SendMessageBody,
    ): DirectMessage

    @GET("verification/request")
    suspend fun fetchVerificationStatus(
        @Header("Authorization") token: String,
    ): Map<String, Any?>

    @POST("verification/request")
    suspend fun submitVerificationRequest(
        @Header("Authorization") token: String,
        @Body body: Map<String, String>,
    ): Map<String, Any?>

    @POST("push/register")
    suspend fun registerPushToken(
        @Header("Authorization") token: String,
        @Body body: Map<String, Any?>,
    ): Map<String, Any?>

    @GET("lists")
    suspend fun fetchLists(@Header("Authorization") token: String): Map<String, Any?>

    @POST("lists")
    suspend fun createList(
        @Header("Authorization") token: String,
        @Body body: Map<String, Any?>,
    ): Map<String, Any?>

    @GET("lists/{listId}")
    suspend fun fetchList(
        @Header("Authorization") token: String,
        @Path("listId") listId: Int,
    ): Map<String, Any?>

    @POST("lists/{listId}/members")
    suspend fun addListMember(
        @Header("Authorization") token: String,
        @Path("listId") listId: Int,
        @Body body: Map<String, String>,
    ): Map<String, Any?>

    @GET("communities")
    suspend fun fetchCommunities(@Header("Authorization") token: String): Map<String, Any?>

    @POST("communities")
    suspend fun createCommunity(
        @Header("Authorization") token: String,
        @Body body: Map<String, String?>,
    ): Map<String, Any?>

    @GET("communities/{slug}")
    suspend fun fetchCommunity(
        @Header("Authorization") token: String,
        @Path("slug") slug: String,
    ): Map<String, Any?>

    @GET("communities/{slug}/timeline")
    suspend fun fetchCommunityTimeline(
        @Header("Authorization") token: String,
        @Path("slug") slug: String,
    ): Map<String, Any?>

    @POST("communities/{slug}")
    suspend fun joinCommunity(
        @Header("Authorization") token: String,
        @Path("slug") slug: String,
    ): Map<String, Any?>
}