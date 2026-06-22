package com.offme.ui.lists

import androidx.compose.foundation.clickable
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
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListsScreen(
    authStore: AuthStore,
    onBack: () -> Unit,
    onOpenList: (Int) -> Unit,
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    val api = OffMeApp.instance.apiClient
    var name by remember { mutableStateOf("") }
    var lists by remember { mutableStateOf<List<Map<String, Any?>>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    fun load() {
        val t = token ?: return
        scope.launch {
            isLoading = true
            try {
                val res = api.fetchLists(t)
                @Suppress("UNCHECKED_CAST")
                lists = res["lists"] as? List<Map<String, Any?>> ?: emptyList()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(token) { load() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Listas") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Nova lista") },
            )
            Button(
                onClick = {
                    val t = token ?: return@Button
                    scope.launch {
                        api.createList(t, name.trim())
                        name = ""
                        load()
                    }
                },
                enabled = name.isNotBlank(),
                modifier = Modifier.padding(top = 8.dp),
            ) {
                Text("Criar lista")
            }

            if (isLoading) {
                Text("Carregando...", modifier = Modifier.padding(top = 16.dp))
            } else if (lists.isEmpty()) {
                Text("Nenhuma lista ainda.", modifier = Modifier.padding(top = 16.dp))
            } else {
                LazyColumn(modifier = Modifier.padding(top = 16.dp)) {
                    items(lists, key = { it["id"].toString() }) { list ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    (list["id"] as? Number)?.toInt()?.let(onOpenList)
                                }
                                .padding(vertical = 12.dp),
                        ) {
                            Text(list["name"]?.toString() ?: "Lista", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "${list["memberCount"]} membros",
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            )
                        }
                    }
                }
            }
        }
    }
}