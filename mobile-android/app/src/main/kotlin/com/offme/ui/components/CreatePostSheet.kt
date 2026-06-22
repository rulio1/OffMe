package com.offme.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.offme.data.api.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatePostSheet(
    visible: Boolean,
    api: ApiClient,
    token: String,
    replyToId: Int? = null,
    communityId: Int? = null,
    onDismiss: () -> Unit,
    onCreated: () -> Unit,
) {
    if (!visible) return

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var text by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var posting by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                text = if (replyToId == null) "Novo post" else "Responder",
                style = MaterialTheme.typography.titleLarge,
            )

            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                placeholder = { Text("O que está acontecendo?") },
                minLines = 4,
            )

            error?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp),
                )
            }

            Button(
                onClick = {
                    val trimmed = text.trim()
                    if (trimmed.isEmpty()) {
                        error = "Escreva algo para publicar"
                        return@Button
                    }
                    scope.launch {
                        posting = true
                        error = null
                        try {
                            api.createPost(token, trimmed, replyToId, communityId)
                            text = ""
                            onCreated()
                            onDismiss()
                        } catch (e: Exception) {
                            error = e.message
                        } finally {
                            posting = false
                        }
                    }
                },
                enabled = !posting,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (posting) "Publicando..." else "Publicar")
            }
        }
    }
}