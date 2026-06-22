package com.offme.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore
import com.offme.data.models.AppNotification
import com.offme.ui.components.UserAvatar
import com.offme.util.Formatters
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onNavigateToProfile: (String) -> Unit,
    onUnreadCountChanged: (Int) -> Unit = {},
) {
    val token = authStore.session.collectAsState().value?.accessToken
    var notifications by remember { mutableStateOf<List<AppNotification>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun load(markRead: Boolean = false) {
        val t = token ?: return
        scope.launch {
            isLoading = notifications.isEmpty()
            error = null
            try {
                val res = api.fetchNotifications(t)
                notifications = res.notifications
                onUnreadCountChanged(res.unreadCount)
                if (markRead && res.unreadCount > 0) {
                    api.markNotificationsRead(t)
                    onUnreadCountChanged(0)
                    notifications = notifications.map { it.copy(read = true) }
                }
            } catch (e: Exception) {
                error = e.message
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(token) { load(markRead = true) }

    Scaffold(topBar = { TopAppBar(title = { Text("Notificações") }) }) { padding ->
        when {
            isLoading && notifications.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            error != null && notifications.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text(error ?: "", color = MaterialTheme.colorScheme.error)
                }
            }
            notifications.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text(
                        "Nenhuma notificação ainda",
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    )
                }
            }
            else -> {
                PullToRefreshBox(
                    isRefreshing = isLoading,
                    onRefresh = { load(markRead = true) },
                    modifier = Modifier.fillMaxSize().padding(padding),
                ) {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(notifications, key = { it.id }) { notification ->
                            NotificationRow(
                                notification = notification,
                                onClick = {
                                    if (notification.postId == null) {
                                        onNavigateToProfile(notification.actor.username)
                                    }
                                },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationRow(
    notification: AppNotification,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (notification.read) {
                    MaterialTheme.colorScheme.surface
                } else {
                    MaterialTheme.colorScheme.surface.copy(alpha = 0.5f)
                },
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        UserAvatar(url = notification.actor.avatarUrl, size = 40.dp)
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "${notification.actor.resolvedDisplayName} ${notification.message}",
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(
                text = Formatters.timeAgo(notification.createdAt),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )
        }
        if (!notification.read) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary),
            )
        }
    }
}