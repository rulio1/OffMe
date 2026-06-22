package com.offme.ui.lists

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.auth.AuthStore
import com.offme.data.models.User

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListDetailScreen(
    listId: Int,
    authStore: AuthStore,
    onBack: () -> Unit,
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    val api = OffMeApp.instance.apiClient
    var listName by remember { mutableStateOf("Lista") }
    var members by remember { mutableStateOf<List<User>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(listId, token) {
        val t = token ?: return@LaunchedEffect
        isLoading = true
        error = null
        try {
            val res = api.fetchList(t, listId)
            @Suppress("UNCHECKED_CAST")
            val list = res["list"] as? Map<String, Any?>
            listName = list?.get("name")?.toString() ?: "Lista"
            @Suppress("UNCHECKED_CAST")
            val rawMembers = res["members"] as? List<Map<String, Any?>> ?: emptyList()
            members = rawMembers.map { m ->
                User(
                    id = (m["id"] as? Number)?.toInt() ?: 0,
                    username = m["username"]?.toString() ?: "",
                    displayName = m["displayName"]?.toString(),
                    avatarUrl = m["avatarUrl"]?.toString(),
                    verified = m["verified"] as? Boolean ?: false,
                )
            }
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(listName) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            when {
                isLoading -> Text("Carregando...")
                error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
                members.isEmpty() -> Text("Nenhum membro nesta lista.")
                else -> LazyColumn {
                    items(members, key = { it.id }) { member ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                        ) {
                            Text(member.resolvedDisplayName, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "@${member.username}",
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            )
                        }
                    }
                }
            }
        }
    }
}