package com.offme.push

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.offme.OffMeApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

object PushRegistrationHelper {
    private const val TAG = "OffMePush"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun registerIfAvailable() {
        val authStore = OffMeApp.instance.authStore
        val api = OffMeApp.instance.apiClient
        val accessToken = authStore.session.value?.accessToken ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                OffMeApp.instance,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        scope.launch {
            runCatching {
                val token = FirebaseMessaging.getInstance().token.await()
                api.registerPushToken(accessToken, token)
            }.onFailure {
                Log.d(TAG, "Push registration skipped: ${it.message}")
            }
        }
    }
}