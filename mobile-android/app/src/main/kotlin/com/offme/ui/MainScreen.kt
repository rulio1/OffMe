package com.offme.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.offme.ui.components.BottomNavBarWithDivider
import com.offme.ui.components.OffMeTab

@Composable
fun MainScreen() {
    var selected by rememberSaveable { mutableStateOf(OffMeTab.Home) }

    Scaffold(
        bottomBar = {
            BottomNavBarWithDivider(
                selected = selected,
                onSelect = { selected = it },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            PlaceholderScreen(tab = selected)
        }
    }
}

@Composable
private fun PlaceholderScreen(tab: OffMeTab) {
    val title = when (tab) {
        OffMeTab.Home -> "Início"
        OffMeTab.Explore -> "Explorar"
        OffMeTab.Grok -> "Grok"
        OffMeTab.Notifications -> "Notificações"
        OffMeTab.Messages -> "Mensagens"
    }

    Column(modifier = Modifier.padding(24.dp)) {
        Text(text = title, style = androidx.compose.material3.MaterialTheme.typography.headlineMedium)
        Text(
            text = "Tela $title — conecte à API em BuildConfig.API_BASE_URL",
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}