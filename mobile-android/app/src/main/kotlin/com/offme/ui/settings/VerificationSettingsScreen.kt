package com.offme.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
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
fun VerificationSettingsScreen(
    authStore: AuthStore,
    onBack: () -> Unit,
) {
    val session by authStore.session.collectAsState()
    val token = session?.accessToken
    val api = OffMeApp.instance.apiClient
    var reason by remember { mutableStateOf("") }
    var status by remember { mutableStateOf<String?>(null) }
    var isVerified by remember { mutableStateOf(session?.user?.verified == true) }
    var isLoading by remember { mutableStateOf(true) }
    var isSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var success by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(token) {
        val t = token ?: return@LaunchedEffect
        isLoading = true
        try {
            val res = api.fetchVerificationStatus(t)
            @Suppress("UNCHECKED_CAST")
            val request = res["request"] as? Map<String, Any?>
            status = request?.get("status")?.toString()
            isVerified = (res["verified"] as? Boolean) ?: (session?.user?.verified == true)
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Verificação") },
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
                .padding(16.dp),
        ) {
            if (isLoading) {
                CircularProgressIndicator()
                return@Column
            }

            Text(
                if (isVerified) "Sua conta já está verificada." else "Solicite o selo de verificação para sua conta.",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            )

            status?.let {
                Spacer(Modifier.height(12.dp))
                Text("Última solicitação: $it")
            }

            if (!isVerified && status != "pending") {
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Por que você deve ser verificado?") },
                    minLines = 4,
                )
                error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
                success?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = {
                        val t = token ?: return@Button
                        scope.launch {
                            isSubmitting = true
                            error = null
                            success = null
                            try {
                                api.submitVerificationRequest(t, reason.trim())
                                success = "Solicitação enviada com sucesso."
                                status = "pending"
                                reason = ""
                            } catch (e: Exception) {
                                error = e.message
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    enabled = !isSubmitting && reason.trim().length >= 10,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (isSubmitting) "Enviando..." else "Enviar solicitação")
                }
            } else if (!isVerified && status == "pending") {
                Spacer(Modifier.height(16.dp))
                Text("Sua solicitação está em análise.")
            }
        }
    }
}