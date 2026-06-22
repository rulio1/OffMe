package com.offme.push

import android.util.Log
import com.offme.OffMeApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

object PushRegistrationHelper {
    private const val TAG = "OffMePush"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun registerIfAvailable() {
        val authStore = OffMeApp.instance.authStore
        val api = OffMeApp.instance.apiClient
        val accessToken = authStore.session.value?.accessToken ?: return

        scope.launch {
            val token = fetchFcmToken() ?: return@launch
            runCatching {
                api.registerPushToken(accessToken, token)
            }.onFailure {
                Log.d(TAG, "Push registration skipped: ${it.message}")
            }
        }
    }

    private suspend fun fetchFcmToken(): String? {
        return runCatching {
            val firebaseMessaging = Class.forName("com.google.firebase.messaging.FirebaseMessaging")
            val getInstance = firebaseMessaging.getMethod("getInstance")
            val instance = getInstance.invoke(null)
            val getToken = instance.javaClass.getMethod("getToken")
            val task = getToken.invoke(instance)
            val await = task.javaClass.getMethod("await")
            await.invoke(task) as? String
        }.getOrNull()
    }
}