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
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.offme.data.models.Post
import com.offme.data.models.User
import com.offme.ui.components.FollowButton
import com.offme.ui.components.PostDivider
import com.offme.ui.components.PostRow
import com.offme.ui.components.UserAvatar
import kotlinx.coroutines.delay

private enum class ExploreSearchTab(val label: String) {
    Top("Top"),
    People("Pessoas"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreScreen(
    authStore: AuthStore,
    api: ApiClient = OffMeApp.instance.apiClient,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit = {},
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    var query by remember { mutableStateOf("") }
    var debouncedQuery by remember { mutableStateOf("") }
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }
    var posts by remember { mutableStateOf<List<Post>>(emptyList()) }
    var trending by remember { mutableStateOf<List<Post>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    var isLoadingTrending by remember { mutableStateOf(false) }

    val selectedTab = ExploreSearchTab.entries[selectedTabIndex]
    val hasQuery = debouncedQuery.isNotEmpty()

    LaunchedEffect(query) {
        delay(300)
        debouncedQuery = query.trim()
    }

    LaunchedEffect(token) {
        val t = token ?: return@LaunchedEffect
        isLoadingTrending = trending.isEmpty()
        try {
            trending = api.fetchTrendingPosts(t)
        } catch (_: Exception) {
            trending = emptyList()
        } finally {
            isLoadingTrending = false
        }
    }

    LaunchedEffect(debouncedQuery, selectedTab, token) {
        val t = token ?: return@LaunchedEffect
        if (debouncedQuery.isEmpty()) {
            users = emptyList()
            posts = emptyList()
            isSearching = false
            return@LaunchedEffect
        }
        isSearching = true
        try {
            when (selectedTab) {
                ExploreSearchTab.Top -> {
                    posts = api.searchPosts(t, debouncedQuery)
                    users = emptyList()
                }
                ExploreSearchTab.People -> {
                    users = api.searchUsers(t, debouncedQuery)
                    posts = emptyList()
                }
            }
        } catch (_: Exception) {
            users = emptyList()
            posts = emptyList()
        } finally {
            isSearching = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Explorar") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background.copy(alpha = 0.95f)
                )
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Buscar posts e pessoas") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(24.dp),
            )

            if (hasQuery) {
                TabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = MaterialTheme.colorScheme.primary,
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                ) {
                    ExploreSearchTab.entries.forEachIndexed { index, tab ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = { Text(tab.label, fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Normal) },
                        )
                    }
                }
            }

            when {
                !hasQuery -> {
                    TrendingContent(
                        trending = trending,
                        isLoading = isLoadingTrending,
                        api = api,
                        token = token,
                        currentUserId = session?.user?.id,
                        onNavigateToProfile = onNavigateToProfile,
                        onNavigateToPost = onNavigateToPost,
                    )
                }
                isSearching -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
                selectedTab == ExploreSearchTab.People -> {
                    UsersSearchContent(
                        users = users,
                        query = debouncedQuery,
                        api = api,
                        token = token,
                        onNavigateToProfile = onNavigateToProfile,
                    )
                }
                else -> {
                    PostsSearchContent(
                        posts = posts,
                        query = debouncedQuery,
                        api = api,
                        token = token,
                        currentUserId = session?.user?.id,
                        onNavigateToProfile = onNavigateToProfile,
                        onNavigateToPost = onNavigateToPost,
                    )
                }
            }
        }
    }
}

@Composable
private fun TrendingContent(
    trending: List<Post>,
    isLoading: Boolean,
    api: ApiClient,
    token: String?,
    currentUserId: Int?,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit,
) {
    when {
        isLoading && trending.isEmpty() -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        else -> {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                item {
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        Text("Em alta", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            "Posts com mais engajamento",
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                }
                if (trending.isEmpty()) {
                    item {
                        Text(
                            "Nenhum post em destaque ainda.",
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                } else {
                    items(trending, key = { it.id }) { post ->
                        PostRow(
                            post = post,
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

@Composable
private fun UsersSearchContent(
    users: List<User>,
    query: String,
    api: ApiClient,
    token: String?,
    onNavigateToProfile: (String) -> Unit,
) {
    if (users.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(
                "Nenhum usuário encontrado para \"$query\".",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )
        }
    } else {
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
                        Text(user.resolvedDisplayName, fontWeight = FontWeight.SemiBold)
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

@Composable
private fun PostsSearchContent(
    posts: List<Post>,
    query: String,
    api: ApiClient,
    token: String?,
    currentUserId: Int?,
    onNavigateToProfile: (String) -> Unit,
    onNavigateToPost: (Int) -> Unit,
) {
    if (posts.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(
                "Nenhum post encontrado para \"$query\".",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )
        }
    } else {
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(posts, key = { it.id }) { post ->
                PostRow(
                    post = post,
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