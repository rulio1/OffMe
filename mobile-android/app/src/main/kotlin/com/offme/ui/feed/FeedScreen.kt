package com.offme.ui.feed

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.offme.OffMeApp
import com.offme.data.api.ApiClient
import com.offme.data.auth.AuthStore
import com.offme.data.models.Post
import com.offme.ui.components.CreatePostSheet
import com.offme.ui.components.PostDivider
import com.offme.ui.components.PostRow
import com.offme.ui.components.UserAvatar
import com.offme.util.Formatters
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch

enum class FeedTab(val label: String) {
    ForYou("For you"),
    Following("Following"),
}

class FeedViewModel(
    private val api: ApiClient,
    private val getToken: () -> String?,
) : ViewModel() {
    var tab by mutableStateOf(FeedTab.ForYou)
    var posts by mutableStateOf<List<Post>>(emptyList())
    var isLoading by mutableStateOf(false)
    var isLoadingMore by mutableStateOf(false)
    var nextCursor by mutableStateOf<String?>(null)
    var error by mutableStateOf<String?>(null)

    fun load(reset: Boolean = true, force: Boolean = false) {
        val token = getToken() ?: return
        viewModelScope.launch {
            if (reset) {
                isLoading = true
                nextCursor = null
            }
            error = null
            try {
                val response = when (tab) {
                    FeedTab.ForYou -> api.forYouTimeline(token)
                    FeedTab.Following -> api.homeTimeline(token)
                }
                posts = response.entries.mapNotNull { it.post }
                nextCursor = response.nextCursor
            } catch (e: Exception) {
                error = e.message
            } finally {
                if (reset) isLoading = false
            }
        }
    }

    fun loadMore() {
        val token = getToken() ?: return
        val cursor = nextCursor ?: return
        if (isLoadingMore) return
        viewModelScope.launch {
            isLoadingMore = true
            try {
                val response = when (tab) {
                    FeedTab.ForYou -> api.forYouTimeline(token, cursor)
                    FeedTab.Following -> api.homeTimeline(token, cursor)
                }
                posts = posts + response.entries.mapNotNull { it.post }
                nextCursor = response.nextCursor
            } catch (e: Exception) {
                error = e.message
            } finally {
                isLoadingMore = false
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit = {},
    onNavigateToBookmarks: () -> Unit = {},
    onLogout: () -> Unit = {},
    viewModel: FeedViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return FeedViewModel(api) { authStore.accessToken } as T
            }
        },
    ),
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    var showCompose by remember { mutableStateOf(false) }
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(DrawerValue.Closed)

    LaunchedEffect(selectedTabIndex) {
        viewModel.tab = if (selectedTabIndex == 0) FeedTab.ForYou else FeedTab.Following
        viewModel.load()
    }

    LaunchedEffect(listState, viewModel.posts.size, viewModel.nextCursor) {
        snapshotFlow {
            val info = listState.layoutInfo
            val last = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= info.totalItemsCount - 2
        }.distinctUntilChanged().collect { nearEnd ->
            if (nearEnd && viewModel.nextCursor != null && !viewModel.isLoadingMore) {
                viewModel.loadMore()
            }
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(modifier = Modifier.fillMaxSize()) {
                    session?.user?.let { user ->
                        Column(modifier = Modifier.padding(16.dp)) {
                            UserAvatar(url = user.avatarUrl, size = 48.dp)
                            Spacer(Modifier.height(8.dp))
                            Text(user.resolvedDisplayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("@${user.username}", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                            Spacer(Modifier.height(8.dp))
                            Row {
                                Text("${Formatters.count(user.followingCount ?: 0)} seguindo  ", fontWeight = FontWeight.SemiBold)
                                Text("${Formatters.count(user.followerCount ?: 0)} seguidores", fontWeight = FontWeight.SemiBold)
                            }
                        }
                        HorizontalDivider()
                    }

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Person, contentDescription = null) },
                        label = { Text("Perfil") },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            session?.user?.username?.let(onNavigateToProfile)
                        },
                    )
                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Bookmark, contentDescription = null) },
                        label = { Text("Salvos") },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            onNavigateToBookmarks()
                        },
                    )
                    Spacer(Modifier.weight(1f))
                    HorizontalDivider()
                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.ExitToApp, contentDescription = null, tint = Color.Red) },
                        label = { Text("Sair", color = Color.Red) },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            onLogout()
                        },
                    )
                }
            }
        },
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("OffMe") },
                    navigationIcon = {
                        session?.user?.let { user ->
                            UserAvatar(
                                url = user.avatarUrl,
                                size = 32.dp,
                                modifier = Modifier
                                    .padding(start = 16.dp)
                                    .clickable {
                                        scope.launch { drawerState.open() }
                                    },
                            )
                        }
                    },
                )
            },
            floatingActionButton = {
                if (token != null) {
                    FloatingActionButton(
                        onClick = { showCompose = true },
                        containerColor = MaterialTheme.colorScheme.primary,
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Novo post")
                    }
                }
            },
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
            ) {
                TabRow(selectedTabIndex = selectedTabIndex) {
                    FeedTab.entries.forEachIndexed { index, tab ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = { Text(tab.label) },
                        )
                    }
                }

                when {
                    viewModel.isLoading && viewModel.posts.isEmpty() -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    viewModel.error != null && viewModel.posts.isEmpty() -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Erro ao carregar", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    viewModel.error ?: "",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                )
                            }
                        }
                    }
                    viewModel.posts.isEmpty() -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Nenhum post ainda", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    "Seja o primeiro a publicar.",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                )
                            }
                        }
                    }
                    else -> {
                        PullToRefreshBox(
                            isRefreshing = viewModel.isLoading,
                            onRefresh = { scope.launch { viewModel.load(force = true) } },
                            modifier = Modifier.fillMaxSize(),
                        ) {
                            LazyColumn(state = listState, modifier = Modifier.fillMaxSize()) {
                                items(viewModel.posts, key = { it.id }) { post ->
                                    PostRow(
                                        post = post,
                                        api = api,
                                        token = token,
                                        currentUserId = session?.user?.id,
                                        onAuthorClick = onNavigateToProfile,
                                        onPostClick = onNavigateToPost,
                                        onDeleted = { viewModel.load(force = true) },
                                    )
                                    PostDivider()
                                }
                                if (viewModel.isLoadingMore) {
                                    item {
                                        Text(
                                            "Carregando...",
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(16.dp),
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
    }

    if (token != null) {
        CreatePostSheet(
            visible = showCompose,
            api = api,
            token = token,
            onDismiss = { showCompose = false },
            onCreated = { viewModel.load(force = true) },
        )
    }
}