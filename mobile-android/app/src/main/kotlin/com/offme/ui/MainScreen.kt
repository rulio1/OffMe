package com.offme.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.offme.OffMeApp
import com.offme.data.auth.AuthStore
import com.offme.ui.bookmarks.BookmarksScreen
import com.offme.ui.components.BetaBanner
import com.offme.ui.components.BottomNavBarWithDivider
import com.offme.ui.components.OffMeTab
import com.offme.ui.explore.ExploreScreen
import com.offme.ui.feed.FeedScreen
import com.offme.ui.messages.ConversationThreadScreen
import com.offme.ui.messages.MessagesScreen
import com.offme.ui.notifications.NotificationsScreen
import com.offme.ui.post.PostThreadScreen
import com.offme.ui.communities.CommunitiesScreen
import com.offme.ui.communities.CommunityDetailScreen
import com.offme.ui.lists.ListDetailScreen
import com.offme.ui.lists.ListsScreen
import com.offme.ui.profile.EditProfileScreen
import com.offme.ui.profile.ProfileScreen
import com.offme.ui.settings.FeedbackScreen
import com.offme.ui.settings.SettingsHubScreen
import com.offme.ui.settings.VerificationSettingsScreen
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

@Composable
fun MainScreen(
    authStore: AuthStore = OffMeApp.instance.authStore,
) {
    var selected by rememberSaveable { mutableStateOf(OffMeTab.Home) }
    var unreadNotifications by remember { mutableIntStateOf(0) }
    var profileUsername by remember { mutableStateOf<String?>(null) }
    var conversationId by remember { mutableStateOf<Int?>(null) }
    var postThreadId by remember { mutableStateOf<Int?>(null) }
    var showEditProfile by remember { mutableStateOf(false) }
    var showVerification by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }
    var showLists by remember { mutableStateOf(false) }
    var showCommunities by remember { mutableStateOf(false) }
    var showFeedback by remember { mutableStateOf(false) }
    var listDetailId by remember { mutableStateOf<Int?>(null) }
    var communityDetailSlug by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        val token = authStore.accessToken ?: return@LaunchedEffect
        try {
            val res = OffMeApp.instance.apiClient.fetchNotifications(token)
            unreadNotifications = res.unreadCount
        } catch (_: Exception) {
            unreadNotifications = 0
        }
    }

    val navigateToProfile: (String) -> Unit = { username ->
        profileUsername = username
    }

    val navigateToConversation: (Int) -> Unit = { id ->
        conversationId = id
    }

    val navigateToPost: (Int) -> Unit = { id ->
        postThreadId = id
    }

    if (showEditProfile) {
        EditProfileScreen(
            authStore = authStore,
            onBack = { showEditProfile = false },
        )
        return
    }

    if (showFeedback) {
        FeedbackScreen(
            authStore = authStore,
            onBack = { showFeedback = false },
        )
        return
    }

    if (showSettings) {
        SettingsHubScreen(
            authStore = authStore,
            onBack = { showSettings = false },
            onVerification = {
                showSettings = false
                showVerification = true
            },
            onLists = {
                showSettings = false
                showLists = true
            },
            onCommunities = {
                showSettings = false
                showCommunities = true
            },
            onLogout = { authStore.logout() },
            onFeedback = {
                showSettings = false
                showFeedback = true
            },
        )
        return
    }

    if (showVerification) {
        VerificationSettingsScreen(
            authStore = authStore,
            onBack = { showVerification = false },
        )
        return
    }

    if (listDetailId != null) {
        ListDetailScreen(
            listId = listDetailId!!,
            authStore = authStore,
            onBack = { listDetailId = null },
        )
        return
    }

    if (communityDetailSlug != null) {
        CommunityDetailScreen(
            slug = communityDetailSlug!!,
            authStore = authStore,
            onBack = { communityDetailSlug = null },
            onNavigateToProfile = navigateToProfile,
            onNavigateToPost = navigateToPost,
        )
        return
    }

    if (showLists) {
        ListsScreen(
            authStore = authStore,
            onBack = { showLists = false },
            onOpenList = { listDetailId = it },
        )
        return
    }

    if (showCommunities) {
        CommunitiesScreen(
            authStore = authStore,
            onBack = { showCommunities = false },
            onOpenCommunity = { communityDetailSlug = it },
        )
        return
    }

    if (conversationId != null) {
        ConversationThreadScreen(
            conversationId = conversationId!!,
            authStore = authStore,
            onBack = { conversationId = null },
        )
        return
    }

    if (postThreadId != null) {
        PostThreadScreen(
            postId = postThreadId!!,
            authStore = authStore,
            onBack = { postThreadId = null },
            onNavigateToProfile = navigateToProfile,
            onNavigateToPost = navigateToPost,
        )
        return
    }

    if (profileUsername != null) {
        ProfileScreen(
            username = profileUsername!!,
            authStore = authStore,
            onBack = { profileUsername = null },
            onNavigateToProfile = { profileUsername = it },
            onNavigateToConversation = navigateToConversation,
            onNavigateToPost = navigateToPost,
            onEditProfile = { showEditProfile = true },
        )
        return
    }

    Scaffold(
        bottomBar = {
            BottomNavBarWithDivider(
                selected = selected,
                onSelect = { tab ->
                    selected = tab
                    if (tab == OffMeTab.Notifications) {
                        scope.launch {
                            val token = authStore.accessToken ?: return@launch
                            try {
                                val res = OffMeApp.instance.apiClient.fetchNotifications(token)
                                unreadNotifications = res.unreadCount
                            } catch (_: Exception) {
                                unreadNotifications = 0
                            }
                        }
                    }
                },
                unreadNotifications = unreadNotifications,
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            BetaBanner(onTap = { showFeedback = true })
            Box(modifier = Modifier.fillMaxSize()) {
                when (selected) {
                    OffMeTab.Home -> FeedScreen(
                        authStore = authStore,
                        onNavigateToProfile = navigateToProfile,
                        onNavigateToPost = navigateToPost,
                        onNavigateToBookmarks = { selected = OffMeTab.Bookmarks },
                        onNavigateToLists = { showLists = true },
                        onNavigateToCommunities = { showCommunities = true },
                        onNavigateToVerification = { showVerification = true },
                        onNavigateToSettings = { showSettings = true },
                        onLogout = { authStore.logout() },
                    )
                    OffMeTab.Explore -> ExploreScreen(
                        authStore = authStore,
                        onNavigateToProfile = navigateToProfile,
                        onNavigateToPost = navigateToPost,
                    )
                    OffMeTab.Bookmarks -> BookmarksScreen(
                        authStore = authStore,
                        onNavigateToProfile = navigateToProfile,
                        onNavigateToPost = navigateToPost,
                    )
                    OffMeTab.Notifications -> NotificationsScreen(
                        authStore = authStore,
                        onNavigateToProfile = navigateToProfile,
                        onUnreadCountChanged = { unreadNotifications = it },
                    )
                    OffMeTab.Messages -> MessagesScreen(
                        authStore = authStore,
                        onNavigateToConversation = navigateToConversation,
                    )
                }
            }
        }
    }
}