package com.offme.ui.components

import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.offme.data.api.ApiClient
import kotlinx.coroutines.launch

@Composable
fun FollowButton(
    username: String,
    isFollowing: Boolean,
    api: ApiClient,
    token: String,
    onUserUpdated: (Boolean) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var following by remember(username, isFollowing) { mutableStateOf(isFollowing) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    OutlinedButton(
        onClick = {
            if (loading) return@OutlinedButton
            scope.launch {
                loading = true
                val wasFollowing = following
                following = !wasFollowing
                try {
                    val user = if (wasFollowing) {
                        api.unfollowUser(token, username)
                    } else {
                        api.followUser(token, username)
                    }
                    following = user.isFollowing ?: !wasFollowing
                    onUserUpdated(following)
                } catch (_: Exception) {
                    following = wasFollowing
                } finally {
                    loading = false
                }
            }
        },
        enabled = !loading,
        modifier = modifier,
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = if (following) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.primary,
        ),
    ) {
        Text(
            when {
                loading -> "..."
                following -> "Seguindo"
                else -> "Seguir"
            },
        )
    }
}