package com.offme.ui.post

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore
import com.offme.data.models.Post
import com.offme.ui.components.CreatePostSheet
import com.offme.ui.components.PostDivider
import com.offme.ui.components.PostRow
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostThreadScreen(
    postId: Int,
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onBack: () -> Unit,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit = {},
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    val currentUserId = session?.user?.id
    var post by remember(postId) { mutableStateOf<Post?>(null) }
    var replies by remember(postId) { mutableStateOf<List<Post>>(emptyList()) }
    var isLoading by remember(postId) { mutableStateOf(false) }
    var error by remember(postId) { mutableStateOf<String?>(null) }
    var showReplySheet by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun load() {
        val t = token ?: return
        scope.launch {
            isLoading = post == null
            error = null
            try {
                val fetchedPost = api.fetchPost(t, postId)
                val fetchedReplies = api.fetchPostReplies(t, postId)
                post = fetchedPost
                replies = fetchedReplies.entries.mapNotNull { it.post }
            } catch (e: Exception) {
                error = e.message
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(postId, token) { load() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Post") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
            )
        },
    ) { padding ->
        when {
            isLoading && post == null -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            error != null && post == null -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text(error ?: "", color = MaterialTheme.colorScheme.error)
                }
            }
            post != null -> {
                val currentPost = post!!
                PullToRefreshBox(
                    isRefreshing = isLoading,
                    onRefresh = { load() },
                    modifier = Modifier.fillMaxSize().padding(padding),
                ) {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        item {
                            PostRow(
                                post = currentPost,
                                api = api,
                                token = token,
                                currentUserId = currentUserId,
                                onAuthorClick = onNavigateToProfile,
                                onPostClick = onNavigateToPost,
                            )
                            PostDivider()
                        }

                        if (token != null) {
                            item {
                                Text(
                                    text = "Poste sua resposta",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { showReplySheet = true }
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    color = MaterialTheme.colorScheme.primary,
                                )
                            }
                        }

                        item {
                            Text(
                                text = if (replies.isEmpty()) {
                                    "Nenhuma resposta ainda"
                                } else {
                                    "${currentPost.replyCount} resposta${if (currentPost.replyCount == 1) "" else "s"}"
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            )
                        }

                        items(replies, key = { it.id }) { reply ->
                            PostRow(
                                post = reply,
                                api = api,
                                token = token,
                                currentUserId = currentUserId,
                                onAuthorClick = onNavigateToProfile,
                                onPostClick = onNavigateToPost,
                            )
                            PostDivider()
                        }
                    }
                }
            }
        }
    }

    if (token != null) {
        CreatePostSheet(
            visible = showReplySheet,
            api = api,
            token = token,
            replyToId = postId,
            onDismiss = { showReplySheet = false },
            onCreated = { load() },
        )
    }
}