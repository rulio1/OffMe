package com.offme.data.auth

import android.content.Context
import android.util.Base64
import com.offme.data.api.ApiClient
import com.offme.data.api.ApiException
import com.offme.data.models.AuthSession
import com.offme.data.models.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

class AuthStore(
    private val api: ApiClient,
    context: Context,
) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _session = MutableStateFlow<AuthSession?>(null)
    val session: StateFlow<AuthSession?> = _session.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isBootstrapping = MutableStateFlow(true)
    val isBootstrapping: StateFlow<Boolean> = _isBootstrapping.asStateFlow()

    val accessToken: String? get() = _session.value?.accessToken
    val isAuthenticated: Boolean get() = _session.value != null

    suspend fun restoreSession() {
        try {
            val refresh = prefs.getString(KEY_REFRESH, null)
            val userJson = prefs.getString(KEY_USER, null)
            val token = prefs.getString(KEY_TOKEN, null)

            if (refresh == null || userJson == null) return

            val user = parseUserJson(userJson) ?: return

            if (token != null && !isTokenExpired(token)) {
                _session.value = AuthSession(token, refresh, user)
                return
            }

            val auth = api.refreshSession(refresh)
            save(auth)
        } catch (_: Exception) {
            logout()
        } finally {
            _isBootstrapping.value = false
        }
    }

    fun save(auth: AuthSession) {
        _session.value = auth
        prefs.edit()
            .putString(KEY_TOKEN, auth.accessToken)
            .putString(KEY_REFRESH, auth.refreshToken)
            .putString(KEY_USER, userToJson(auth.user))
            .apply()
    }

    fun logout() {
        _session.value = null
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_REFRESH)
            .remove(KEY_USER)
            .apply()
    }

    suspend fun login(identifier: String, password: String) {
        _isLoading.value = true
        try {
            save(api.login(identifier, password))
        } finally {
            _isLoading.value = false
        }
    }

    suspend fun register(
        username: String,
        email: String,
        password: String,
        displayName: String,
    ) {
        _isLoading.value = true
        try {
            save(api.register(username, email, password, displayName))
        } finally {
            _isLoading.value = false
        }
    }

    fun updateUser(user: User) {
        val current = _session.value ?: return
        save(current.copy(user = user))
    }

    fun errorMessage(error: Throwable): String = when (error) {
        is ApiException.Unauthorized -> error.message ?: "Não autenticado"
        is ApiException.Server -> error.message ?: "Erro do servidor"
        is ApiException.Network -> error.message ?: "Erro de rede"
        else -> error.message ?: "Erro desconhecido"
    }

    private fun isTokenExpired(token: String): Boolean {
        val parts = token.split(".")
        if (parts.size < 2) return true
        return try {
            val payload = parts[1]
            val padded = payload.padEnd(((payload.length + 3) / 4) * 4, '=')
            val decoded = String(Base64.decode(padded, Base64.URL_SAFE or Base64.NO_WRAP))
            val exp = JSONObject(decoded).optLong("exp", 0L)
            if (exp == 0L) true else System.currentTimeMillis() / 1000 >= exp - 30
        } catch (_: Exception) {
            true
        }
    }

    private fun userToJson(user: User): String = JSONObject().apply {
        put("id", user.id)
        put("username", user.username)
        put("displayName", user.displayName)
        put("avatarUrl", user.avatarUrl)
        put("bannerUrl", user.bannerUrl)
        put("verified", user.verified)
        put("bio", user.bio)
        put("followerCount", user.followerCount)
        put("followingCount", user.followingCount)
        put("isFollowing", user.isFollowing)
    }.toString()

    private fun parseUserJson(json: String): User? = try {
        val obj = JSONObject(json)
        User(
            id = obj.optInt("id"),
            username = obj.optString("username"),
            displayName = obj.optString("displayName").ifBlank { null },
            avatarUrl = obj.optString("avatarUrl").ifBlank { null },
            bannerUrl = obj.optString("bannerUrl").ifBlank { null },
            verified = obj.optBoolean("verified"),
            bio = obj.optString("bio").ifBlank { null },
            followerCount = obj.optInt("followerCount").takeIf { obj.has("followerCount") && !obj.isNull("followerCount") },
            followingCount = obj.optInt("followingCount").takeIf { obj.has("followingCount") && !obj.isNull("followingCount") },
            isFollowing = obj.optBoolean("isFollowing").takeIf { obj.has("isFollowing") && !obj.isNull("isFollowing") },
        )
    } catch (_: Exception) {
        null
    }

    companion object {
        private const val PREFS_NAME = "offme_auth"
        private const val KEY_TOKEN = "offme_access_token"
        private const val KEY_REFRESH = "offme_refresh_token"
        private const val KEY_USER = "offme_user_json"
    }
}