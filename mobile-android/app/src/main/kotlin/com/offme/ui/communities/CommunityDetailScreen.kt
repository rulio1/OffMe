package com.offme.ui.communities

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.auth.AuthStore
import com.offme.data.models.Post
import com.offme.ui.components.CreatePostSheet
import com.offme.ui.components.PostRow
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityDetailScreen(
    slug: String,
    authStore: AuthStore,
    onBack: () -> Unit,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit,
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    val currentUserId = session?.user?.id
    val api = OffMeApp.instance.apiClient
    val scope = rememberCoroutineScope()

    var communityName by remember { mutableStateOf("Comunidade") }
    var communityId by remember { mutableStateOf<Int?>(null) }
    var memberCount by remember { mutableStateOf(0) }
    var description by remember { mutableStateOf<String?>(null) }
    var posts by remember { mutableStateOf<List<Post>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showComposer by remember { mutableStateOf(false) }

    fun load() {
        val t = token ?: return
        scope.launch {
            isLoading = posts.isEmpty()
            error = null
            try {
                val communityRes = api.fetchCommunity(t, slug)
                @Suppress("UNCHECKED_CAST")
                val community = communityRes["community"] as? Map<String, Any?>
                communityName = community?.get("name")?.toString() ?: "Comunidade"
                communityId = (community?.get("id") as? Number)?.toInt()
                memberCount = (community?.get("memberCount") as? Number)?.toInt() ?: 0
                description = community?.get("description")?.toString()

                val timelineRes = api.fetchCommunityTimeline(t, slug)
                @Suppress("UNCHECKED_CAST")
                val entries = timelineRes["entries"] as? List<Map<String, Any?>> ?: emptyList()
                posts = entries.mapNotNull { entry ->
                    @Suppress("UNCHECKED_CAST")
                    val postMap = entry["post"] as? Map<String, Any?> ?: return@mapNotNull null
                    Post(
                        id = (postMap["id"] as? Number)?.toInt() ?: return@mapNotNull null,
                        authorId = (postMap["authorId"] as? Number)?.toInt() ?: 0,
                        text = postMap["text"]?.toString() ?: "",
                        createdAt = (postMap["createdAt"] as? Number)?.toLong() ?: 0L,
                        likeCount = (postMap["likeCount"] as? Number)?.toInt() ?: 0,
                        repostCount = (postMap["repostCount"] as? Number)?.toInt() ?: 0,
                        replyCount = (postMap["replyCount"] as? Number)?.toInt() ?: 0,
                    )
                }
            } catch (e: Exception) {
                error = e.message
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(slug, token) { load() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(communityName)
                        Text(
                            "@$slug · $memberCount membros",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                actions = {
                    Button(
                        onClick = {
                            val t = token ?: return@Button
                            scope.launch {
                                try {
                                    api.joinCommunity(t, slug)
                                    load()
                                } catch (_: Exception) {
                                }
                            }
                        },
                    ) {
                        Text("Entrar")
                    }
                },
            )
        },
        floatingActionButton = {
            if (token != null && communityId != null) {
                FloatingActionButton(onClick = { showComposer = true }) {
                    Text("+")
                }
            }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            description?.let {
                Text(
                    it,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                )
            }

            when {
                isLoading -> Text("Carregando...", modifier = Modifier.padding(16.dp))
                error != null -> Text(error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp))
                posts.isEmpty() -> Text("Nenhum post nesta comunidade.", modifier = Modifier.padding(16.dp))
                else -> LazyColumn {
                    items(posts, key = { it.id }) { post ->
                        PostRow(
                            post = post,
                            api = api,
                            token = token,
                            currentUserId = currentUserId,
                            onAuthorClick = onNavigateToProfile,
                            onPostClick = onNavigateToPost,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }
    }

    if (token != null && communityId != null) {
        CreatePostSheet(
            visible = showComposer,
            api = api,
            token = token,
            communityId = communityId,
            onDismiss = { showComposer = false },
            onCreated = { load() },
        )
    }
}