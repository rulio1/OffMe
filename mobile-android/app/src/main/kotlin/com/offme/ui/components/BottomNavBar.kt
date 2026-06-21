package com.offme.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

enum class OffMeTab(val label: String) {
    Home("Início"),
    Explore("Explorar"),
    Bookmarks("Salvos"),
    Notifications("Notificações"),
    Messages("Mensagens"),
}

private data class TabSpec(
    val tab: OffMeTab,
    val icon: XNavIconKind,
)

private val tabs = listOf(
    TabSpec(OffMeTab.Home, XNavIconKind.Home),
    TabSpec(OffMeTab.Explore, XNavIconKind.Search),
    TabSpec(OffMeTab.Bookmarks, XNavIconKind.Bookmarks),
    TabSpec(OffMeTab.Notifications, XNavIconKind.Notifications),
    TabSpec(OffMeTab.Messages, XNavIconKind.Messages),
)

/** Barra inferior — Material Symbols, sem legendas. */
@Composable
fun BottomNavBar(
    selected: OffMeTab,
    onSelect: (OffMeTab) -> Unit,
    unreadNotifications: Int = 0,
    modifier: Modifier = Modifier,
) {
    NavigationBar(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
    ) {
        tabs.forEach { spec ->
            val isSelected = selected == spec.tab

            NavigationBarItem(
                selected = isSelected,
                onClick = { onSelect(spec.tab) },
                icon = {
                    if (spec.tab == OffMeTab.Notifications && unreadNotifications > 0) {
                        BadgedBox(badge = { Badge() }) {
                            XNavIcon(
                                kind = spec.icon,
                                active = isSelected,
                                tint = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    } else {
                        XNavIcon(
                            kind = spec.icon,
                            active = isSelected,
                            tint = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                },
                label = {},
                alwaysShowLabel = false,
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = MaterialTheme.colorScheme.surface,
                ),
            )
        }
    }
}

@Composable
fun BottomNavBarWithDivider(
    selected: OffMeTab,
    onSelect: (OffMeTab) -> Unit,
    unreadNotifications: Int = 0,
) {
    HorizontalDivider(
        thickness = 0.5.dp,
        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
    )
    BottomNavBar(
        selected = selected,
        onSelect = onSelect,
        unreadNotifications = unreadNotifications,
    )
}