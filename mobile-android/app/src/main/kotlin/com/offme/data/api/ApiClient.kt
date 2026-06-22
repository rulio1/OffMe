package com.offme.data.api

import com.offme.BuildConfig
import com.offme.data.models.ApiErrorBody
import com.offme.data.models.AuthSession
import com.offme.data.models.CreatePostBody
import com.offme.data.models.LoginBody
import com.offme.data.models.Post
import com.offme.data.models.RegisterBody
import com.offme.data.models.ReportUserBody
import com.offme.data.models.RefreshBody
import com.offme.data.models.SendMessageBody
import com.offme.data.models.StartConversationBody
import com.offme.data.models.UpdateProfileBody
import com.offme.data.models.User
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class ApiClient {
    private val service: ApiService

    init {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(logging)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(ensureTrailingSlash(BuildConfig.API_BASE_URL))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(GsonProvider.gson))
            .build()

        service = retrofit.create(ApiService::class.java)
    }

    private fun ensureTrailingSlash(url: String): String =
        if (url.endsWith("/")) url else "$url/"

    private fun bearer(token: String): String = "Bearer $token"

    private suspend fun <T> safeCall(block: suspend () -> T): T {
        try {
            return block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw ApiException.Unauthorized()
            val errorBody = e.response()?.errorBody()?.string()
            val message = errorBody?.let {
                runCatching {
                    GsonProvider.gson.fromJson(it, ApiErrorBody::class.java).message
                }.getOrNull()
            } ?: "Erro HTTP ${e.code()}"
            throw ApiException.Server(message)
        } catch (e: ApiException) {
            throw e
        } catch (e: Exception) {
            throw ApiException.Network(e.message ?: "Erro de rede")
        }
    }

    suspend fun login(identifier: String, password: String): AuthSession = safeCall {
        val value = identifier.trim().lowercase()
        service.login(LoginBody(identifier = value, email = value, password = password))
    }

    suspend fun register(
        username: String,
        email: String,
        password: String,
        displayName: String,
    ): AuthSession = safeCall {
        service.register(RegisterBody(username, email, password, displayName))
    }

    suspend fun refreshSession(refreshToken: String): AuthSession = safeCall {
        service.refresh(RefreshBody(refreshToken))
    }

    suspend fun me(token: String): User = safeCall {
        service.me(bearer(token)).user
    }

    suspend fun forYouTimeline(token: String, cursor: String? = null) = safeCall {
        service.forYouTimeline(bearer(token), cursor)
    }

    suspend fun homeTimeline(token: String, cursor: String? = null) = safeCall {
        service.homeTimeline(bearer(token), cursor)
    }

    suspend fun createPost(
        token: String,
        text: String,
        replyToId: Int? = null,
        communityId: Int? = null,
        scheduledAt: String? = null,
    ): Post = safeCall {
        service.createPost(
            bearer(token),
            CreatePostBody(text, replyToId, null, communityId, scheduledAt),
        )
    }

    suspend fun reportUser(token: String, username: String, reason: String = "abuse") = safeCall {
        service.reportUser(bearer(token), username, ReportUserBody(reason))
    }

    suspend fun fetchPost(token: String, postId: Int): Post = safeCall {
        service.fetchPost(bearer(token), postId)
    }

    suspend fun fetchPostReplies(token: String, postId: Int, cursor: String? = null) = safeCall {
        service.fetchPostReplies(bearer(token), postId, cursor)
    }

    suspend fun deletePost(token: String, postId: Int) = safeCall {
        service.deletePost(bearer(token), postId)
    }

    suspend fun searchPosts(token: String, query: String): List<Post> = safeCall {
        service.searchPosts(bearer(token), query).posts
    }

    suspend fun fetchTrendingPosts(token: String): List<Post> = safeCall {
        service.fetchTrendingPosts(bearer(token)).posts
    }

    suspend fun fetchBookmarks(token: String, cursor: String? = null) = safeCall {
        service.fetchBookmarks(bearer(token), cursor)
    }

    suspend fun searchUsers(token: String, query: String): List<User> = safeCall {
        service.searchUsers(bearer(token), query).users
    }

    suspend fun userProfile(token: String, username: String) = safeCall {
        service.userProfile(bearer(token), username)
    }

    suspend fun updateProfile(
        token: String,
        displayName: String?,
        bio: String?,
        location: String? = null,
        websiteUrl: String? = null,
    ): User = safeCall {
        service.updateProfile(
            bearer(token),
            UpdateProfileBody(
                displayName = displayName,
                bio = bio,
                location = location,
                websiteUrl = websiteUrl,
            ),
        ).user
    }

    suspend fun userPosts(token: String, username: String) = safeCall {
        service.userPosts(bearer(token), username)
    }

    suspend fun followUser(token: String, username: String): User = safeCall {
        service.followUser(bearer(token), username).user
    }

    suspend fun unfollowUser(token: String, username: String): User = safeCall {
        service.unfollowUser(bearer(token), username).user
    }

    suspend fun likePost(token: String, postId: Int) = safeCall {
        service.likePost(bearer(token), postId)
    }

    suspend fun unlikePost(token: String, postId: Int) = safeCall {
        service.unlikePost(bearer(token), postId)
    }

    suspend fun repostPost(token: String, postId: Int) = safeCall {
        service.repostPost(bearer(token), postId)
    }

    suspend fun unrepostPost(token: String, postId: Int) = safeCall {
        service.unrepostPost(bearer(token), postId)
    }

    suspend fun bookmarkPost(token: String, postId: Int) = safeCall {
        service.bookmarkPost(bearer(token), postId)
    }

    suspend fun unbookmarkPost(token: String, postId: Int) = safeCall {
        service.unbookmarkPost(bearer(token), postId)
    }

    suspend fun fetchNotifications(token: String) = safeCall {
        service.fetchNotifications(bearer(token))
    }

    suspend fun markNotificationsRead(token: String) = safeCall {
        service.markNotificationsRead(bearer(token))
    }

    suspend fun fetchConversations(token: String) = safeCall {
        service.fetchConversations(bearer(token)).conversations
    }

    suspend fun startConversation(token: String, username: String) = safeCall {
        service.startConversation(bearer(token), StartConversationBody(username)).conversation
    }

    suspend fun fetchMessages(token: String, conversationId: Int) = safeCall {
        service.fetchMessages(bearer(token), conversationId).messages
    }

    suspend fun sendMessage(token: String, conversationId: Int, text: String) = safeCall {
        service.sendMessage(bearer(token), conversationId, SendMessageBody(text))
    }

    suspend fun fetchVerificationStatus(token: String) = safeCall {
        service.fetchVerificationStatus(bearer(token))
    }

    suspend fun submitVerificationRequest(token: String, reason: String) = safeCall {
        service.submitVerificationRequest(bearer(token), mapOf("reason" to reason))
    }

    suspend fun registerPushToken(token: String, deviceToken: String) = safeCall {
        service.registerPushToken(
            bearer(token),
            mapOf("platform" to "android", "token" to deviceToken),
        )
    }

    suspend fun fetchLists(token: String) = safeCall {
        service.fetchLists(bearer(token))
    }

    suspend fun createList(token: String, name: String) = safeCall {
        service.createList(bearer(token), mapOf("name" to name, "isPrivate" to false))
    }

    suspend fun fetchList(token: String, listId: Int) = safeCall {
        service.fetchList(bearer(token), listId)
    }

    suspend fun addListMember(token: String, listId: Int, username: String) = safeCall {
        service.addListMember(bearer(token), listId, mapOf("username" to username))
    }

    suspend fun fetchCommunities(token: String) = safeCall {
        service.fetchCommunities(bearer(token))
    }

    suspend fun createCommunity(token: String, name: String) = safeCall {
        service.createCommunity(bearer(token), mapOf("name" to name))
    }

    suspend fun fetchCommunity(token: String, slug: String) = safeCall {
        service.fetchCommunity(bearer(token), slug)
    }

    suspend fun fetchCommunityTimeline(token: String, slug: String) = safeCall {
        service.fetchCommunityTimeline(bearer(token), slug)
    }

    suspend fun joinCommunity(token: String, slug: String) = safeCall {
        service.joinCommunity(bearer(token), slug)
    }
}