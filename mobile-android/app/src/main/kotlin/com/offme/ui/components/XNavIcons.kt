package com.offme.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

enum class XNavIconKind {
    Home,
    Search,
    Bookmarks,
    Notifications,
    Messages,
}

private fun iconFor(kind: XNavIconKind, active: Boolean): ImageVector = when (kind) {
    XNavIconKind.Home -> if (active) Icons.Filled.Home else Icons.Outlined.Home
    XNavIconKind.Search -> if (active) Icons.Filled.Search else Icons.Outlined.Search
    XNavIconKind.Bookmarks -> if (active) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder
    XNavIconKind.Notifications ->
        if (active) Icons.Filled.Notifications else Icons.Outlined.NotificationsNone
    XNavIconKind.Messages -> if (active) Icons.Filled.Email else Icons.Outlined.Email
}

@Composable
fun XNavIcon(
    kind: XNavIconKind,
    active: Boolean,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    Icon(
        imageVector = iconFor(kind, active),
        contentDescription = null,
        modifier = modifier.size(26.dp),
        tint = tint.copy(alpha = if (active) 1f else 0.78f),
    )
}