package com.offme.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.offme.OffMeApp
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore
import com.offme.data.models.Post
import com.offme.data.models.User
import com.offme.ui.components.FollowButton
import com.offme.ui.components.PostDivider
import com.offme.ui.components.PostRow
import com.offme.ui.components.UserAvatar
import com.offme.util.Formatters
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    username: String,
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onBack: () -> Unit,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToConversation: (Int) -> Unit = {},
    onNavigateToPost: (Int) -> Unit = {},
    onEditProfile: () -> Unit = {},
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    var user by remember(username) { mutableStateOf<User?>(null) }
    var isOwnProfile by remember(username) { mutableStateOf(false) }
    var posts by remember(username) { mutableStateOf<List<Post>>(emptyList()) }
    var isLoading by remember(username) { mutableStateOf(false) }
    var error by remember(username) { mutableStateOf<String?>(null) }
    var isFollowing by remember(username) { mutableStateOf(false) }
    var startingDm by remember { mutableStateOf(false) }
    var reporting by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun load() {
        val t = token ?: return
        scope.launch {
            isLoading = user == null
            error = null
            try {
                val profile = api.userProfile(t, username)
                val timeline = api.userPosts(t, username)
                user = profile.user
                isOwnProfile = profile.isOwnProfile
                isFollowing = profile.user.isFollowing ?: false
                posts = timeline.entries.mapNotNull { it.post }
            } catch (e: Exception) {
                error = e.message
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(username, token) { load() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(user?.resolvedDisplayName ?: username) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
            )
        },
    ) { padding ->
        when {
            isLoading && user == null -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            error != null && user == null -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Perfil não encontrado", style = MaterialTheme.typography.titleMedium)
                        Text(error ?: "", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    }
                }
            }
             user != null -> {
                 val profileUser = user!!
                 PullToRefreshBox(
                    isRefreshing = isLoading,
                    onRefresh = { load() },
                    modifier = Modifier.fillMaxSize().padding(padding),
                ) {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        item {
                            ProfileHeader(
                                user = profileUser,
                                isOwnProfile = isOwnProfile,
                                isFollowing = isFollowing,
                                startingDm = startingDm,
                                api = api,
                                token = token,
                                onFollowingChanged = { isFollowing = it },
                                onEditProfile = onEditProfile,
                                onMessage = {
                                    val t = token ?: return@ProfileHeader
                                    scope.launch {
                                        startingDm = true
                                        try {
                                            val conversation = api.startConversation(t, profileUser.username)
                                            onNavigateToConversation(conversation.id)
                                        } catch (e: Exception) {
                                            error = e.message
                                        } finally {
                                            startingDm = false
                                        }
                                    }
                                },
                                onReport = { showReportDialog = true },
                            )
                            PostDivider()
                        }
                        if (posts.isEmpty()) {
                            item {
                                Text(
                                    if (isOwnProfile) {
                                        "Você ainda não publicou nada."
                                    } else {
                                        "Este usuário ainda não publicou nada."
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                )
                            }
                        } else {
                            items(posts, key = { it.id }) { post ->
                                PostRow(
                                    post = post,
                                    api = api,
                                    token = token,
                                    currentUserId = session?.user?.id,
                                    onAuthorClick = onNavigateToProfile,
                                    onPostClick = onNavigateToPost,
                                    onDeleted = { load() },
                                )
                                PostDivider()
                            }
                        }
                    }
                }
            }
        }
    }

    if (showReportDialog && user != null && token != null) {
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            title = { Text("Denunciar usuário") },
            text = { Text("Denunciar @${user!!.username}?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            reporting = true
                            try {
                                api.reportUser(token!!, user!!.username)
                                showReportDialog = false
                            } catch (e: Exception) {
                                error = e.message
                            } finally {
                                reporting = false
                            }
                        }
                    },
                    enabled = !reporting,
                ) {
                    Text(if (reporting) "..." else "Denunciar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReportDialog = false }) {
                    Text("Cancelar")
                }
            },
        )
    }
}

@Composable
private fun ProfileHeader(
    user: User,
    isOwnProfile: Boolean,
    isFollowing: Boolean,
    startingDm: Boolean,
    api: ApiClient,
    token: String?,
    onFollowingChanged: (Boolean) -> Unit,
    onEditProfile: () -> Unit,
    onMessage: () -> Unit,
    onReport: () -> Unit,
) {
    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .background(MaterialTheme.colorScheme.outline),
        ) {
            val bannerUrl = resolveImageUrl(user.bannerUrl)
            if (!bannerUrl.isNullOrBlank()) {
                AsyncImage(
                    model = bannerUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            UserAvatar(
                url = user.avatarUrl,
                size = 72.dp,
                modifier = Modifier.offset(y = (-36).dp),
            )

            if (isOwnProfile) {
                OutlinedButton(
                    onClick = onEditProfile,
                    modifier = Modifier.padding(top = 8.dp),
                ) {
                    Text("Editar perfil")
                }
            } else if (token != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onMessage,
                        enabled = !startingDm,
                        modifier = Modifier.padding(top = 8.dp),
                    ) {
                        Text(if (startingDm) "..." else "Mensagem")
                    }
                    FollowButton(
                        username = user.username,
                        isFollowing = isFollowing,
                        api = api,
                        token = token,
                        onUserUpdated = onFollowingChanged,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }
        }

        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(user.resolvedDisplayName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                if (user.isOfficial) {
                    Spacer(Modifier.width(4.dp))
                    OfficialBadge(size = 20.dp)
                }
            }
            Text(
                "@${user.username}",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )
            user.bio?.takeIf { it.isNotBlank() }?.let {
                Spacer(Modifier.height(8.dp))
                Text(it)
            }
            user.location?.takeIf { it.isNotBlank() }?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }
            user.websiteUrl?.takeIf { it.isNotBlank() }?.let {
                Spacer(Modifier.height(4.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("${Formatters.count(user.followingCount ?: 0)} seguindo")
                Text("${Formatters.count(user.followerCount ?: 0)} seguidores")
            }
            if (!isOwnProfile && token != null) {
                Spacer(Modifier.height(12.dp))
                OutlinedButton(onClick = onReport) {
                    Text("Denunciar usuário")
                }
            }
        }
    }
}