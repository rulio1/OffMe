package com.offme.push

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.offme.OffMeApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class OffMeFirebaseMessagingService : FirebaseMessagingService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        val authStore = OffMeApp.instance.authStore
        val accessToken = authStore.session.value?.accessToken ?: return
        scope.launch {
            runCatching {
                OffMeApp.instance.apiClient.registerPushToken(accessToken, token)
            }.onFailure {
                Log.d(TAG, "FCM token registration skipped: ${it.message}")
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        Log.d(TAG, "Push received: ${message.notification?.title}")
    }

    companion object {
        private const val TAG = "OffMeFCM"
    }
}