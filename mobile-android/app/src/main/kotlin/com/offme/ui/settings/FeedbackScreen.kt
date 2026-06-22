package com.offme.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.SpeakerNotes
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.offme.OffMeApp
import com.offme.data.auth.AuthStore
import kotlinx.coroutines.launch

private enum class FeedbackCategory(val key: String, val title: String, val hint: String, val icon: ImageVector) {
    Bug("bug", "Bug", "Algo quebrou ou não funciona como esperado", Icons.Default.BugReport),
    Idea("idea", "Ideia", "Sugestão de melhoria ou nova funcionalidade", Icons.Default.Lightbulb),
    General("general", "Geral", "Comentário, elogio ou outra observação", Icons.Default.SpeakerNotes);
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedbackScreen(
    authStore: AuthStore,
    onBack: () -> Unit,
) {
    var category by rememberSaveable { mutableStateOf(FeedbackCategory.General) }
    var message by rememberSaveable { mutableStateOf("") }
    var submitting by rememberSaveable { mutableStateOf(false) }
    var success by rememberSaveable { mutableStateOf(false) }
    var errorMsg by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val trimmed = message.trim()
    val canSubmit = !submitting && !success && trimmed.length >= 5

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Feedback beta") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                "Estamos em beta aberto e cada mensagem conta. Bugs, ideias e impressões gerais são bem-vindos — lemos tudo.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )

            Text("Categoria", style = MaterialTheme.typography.titleSmall)
            FeedbackCategory.entries.forEach { item ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                ) {
                    Icon(item.icon, contentDescription = null)
                    Spacer(Modifier.height(0.dp))
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(item.title)
                        Text(
                            item.hint,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    if (category == item) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    } else {
                        Box(modifier = Modifier.height(24.dp))
                    }
                }
                HorizontalDivider()
            }

            OutlinedTextField(
                value = message,
                onValueChange = { message = it.take(2000) },
                label = { Text("Mensagem") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                enabled = !success,
                isError = errorMsg != null,
                supportingText = {
                    Text("${message.length}/2000 · mínimo 5 caracteres")
                },
            )

            errorMsg?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            if (success) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(0.dp))
                    Text("Obrigado! Seu feedback foi recebido.", modifier = Modifier.padding(start = 8.dp))
                }
            }

            Button(
                onClick = {
                    submitting = true
                    errorMsg = null
                    scope.launch {
                        try {
                            val token = authStore.accessToken ?: throw IllegalStateException("Não autenticado")
                            OffMeApp.instance.apiClient.submitFeedback(
                                token = token,
                                category = category.key,
                                message = trimmed,
                                pageUrl = null,
                            )
                            success = true
                            message = ""
                        } catch (e: Exception) {
                            errorMsg = e.message ?: "Erro ao enviar feedback"
                        } finally {
                            submitting = false
                        }
                    }
                },
                enabled = canSubmit,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (submitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.height(18.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(Modifier.height(0.dp))
                }
                Text(if (submitting) "Enviando..." else "Enviar feedback", modifier = Modifier.padding(start = 8.dp))
            }
        }
    }
}