package com.offme.ui.bookmarks

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore
import com.offme.data.models.Post
import com.offme.ui.components.PostDivider
import com.offme.ui.components.PostRow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookmarksScreen(
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit = {},
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    var posts by remember { mutableStateOf<List<Post>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isLoadingMore by remember { mutableStateOf(false) }
    var nextCursor by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    fun load(reset: Boolean = true) {
        val t = token ?: return
        scope.launch {
            if (reset) {
                isLoading = true
                nextCursor = null
            }
            error = null
            try {
                val response = api.fetchBookmarks(t, if (reset) null else nextCursor)
                posts = if (reset) {
                    response.entries.mapNotNull { it.post }
                } else {
                    posts + response.entries.mapNotNull { it.post }
                }
                nextCursor = response.nextCursor
            } catch (e: Exception) {
                error = e.message
            } finally {
                if (reset) isLoading = false
            }
        }
    }

    fun loadMore() {
        val t = token ?: return
        val cursor = nextCursor ?: return
        if (isLoadingMore) return
        scope.launch {
            isLoadingMore = true
            try {
                val response = api.fetchBookmarks(t, cursor)
                posts = posts + response.entries.mapNotNull { it.post }
                nextCursor = response.nextCursor
            } catch (e: Exception) {
                error = e.message
            } finally {
                isLoadingMore = false
            }
        }
    }

    LaunchedEffect(token) { load() }

    LaunchedEffect(listState, posts.size, nextCursor) {
        snapshotFlow {
            val info = listState.layoutInfo
            val last = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= info.totalItemsCount - 2
        }.distinctUntilChanged().collect { nearEnd ->
            if (nearEnd && nextCursor != null && !isLoadingMore) {
                loadMore()
            }
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Salvos") }) }) { padding ->
        when {
            token == null -> {
                Box(
                    Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("Faça login para ver seus salvos.")
                }
            }
            isLoading && posts.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            error != null && posts.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Erro ao carregar")
                        Text(error ?: "", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    }
                }
            }
            posts.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Nenhum post salvo", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Salve posts para ler depois.",
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                }
            }
            else -> {
                PullToRefreshBox(
                    isRefreshing = isLoading,
                    onRefresh = { load() },
                    modifier = Modifier.fillMaxSize().padding(padding),
                ) {
                    LazyColumn(state = listState, modifier = Modifier.fillMaxSize()) {
                        items(posts, key = { it.id }) { post ->
                            PostRow(
                                post = post,
                                api = api,
                                token = token,
                                currentUserId = session?.user?.id,
                                onAuthorClick = onNavigateToProfile,
                                onPostClick = onNavigateToPost,
                            )
                            PostDivider()
                        }
                        if (isLoadingMore) {
                            item {
                                Text(
                                    "Carregando...",
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    color = MaterialTheme.colorScheme.primary,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}