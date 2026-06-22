package com.offme.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.offme.OffMeApp
import com.offme.data.auth.AuthStore
import com.offme.push.PushRegistrationHelper
import com.offme.ui.auth.LoginScreen
import com.offme.ui.auth.SignupScreen

@Composable
fun RootScreen(
    authStore: AuthStore = OffMeApp.instance.authStore,
) {
    val session by authStore.session.collectAsState()
    val isBootstrapping by authStore.isBootstrapping.collectAsState()

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { _ ->
        PushRegistrationHelper.registerIfAvailable()
    }

    LaunchedEffect(Unit) {
        authStore.restoreSession()
    }

    LaunchedEffect(session?.accessToken) {
        if (session == null) return@LaunchedEffect
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            PushRegistrationHelper.registerIfAvailable()
        }
    }

    when {
        isBootstrapping -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        session != null -> {
            MainScreen(authStore = authStore)
        }
        else -> {
            val navController = rememberNavController()
            NavHost(
                navController = navController,
                startDestination = "login",
            ) {
                composable("login") {
                    LoginScreen(
                        authStore = authStore,
                        onNavigateToSignup = { navController.navigate("signup") },
                    )
                }
                composable("signup") {
                    SignupScreen(
                        authStore = authStore,
                        onBack = { navController.popBackStack() },
                    )
                }
            }
        }
    }
}