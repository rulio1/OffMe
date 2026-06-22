package com.offme.ui.explore

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore
import com.offme.data.models.User
import com.offme.ui.components.FollowButton
import com.offme.ui.components.UserAvatar
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreScreen(
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onNavigateToProfile: (String) -> Unit,
) {
    val token = authStore.session.collectAsState().value?.accessToken
    var query by remember { mutableStateOf("") }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }

    LaunchedEffect(query, token) {
        val trimmed = query.trim()
        if (trimmed.isEmpty() || token == null) {
            users = emptyList()
            return@LaunchedEffect
        }
        delay(300)
        isLoading = true
        try {
            users = api.searchUsers(token, trimmed)
        } catch (_: Exception) {
            users = emptyList()
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Explorar") }) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Buscar usuários") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
            )

            when {
                query.trim().isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            "Digite um nome ou @usuário",
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                }
                isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                users.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            "Nenhum usuário encontrado.",
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                }
                else -> {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(users, key = { it.id }) { user ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onNavigateToProfile(user.username) }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                UserAvatar(url = user.avatarUrl, size = 44.dp)
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        user.resolvedDisplayName,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Text(
                                        "@${user.username}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    )
                                    user.bio?.takeIf { it.isNotBlank() }?.let {
                                        Text(
                                            it,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                            maxLines = 1,
                                        )
                                    }
                                }
                                if (token != null) {
                                    FollowButton(
                                        username = user.username,
                                        isFollowing = user.isFollowing ?: false,
                                        api = api,
                                        token = token,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}