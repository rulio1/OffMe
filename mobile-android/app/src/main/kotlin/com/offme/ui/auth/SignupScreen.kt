package com.offme.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.offme.data.auth.AuthStore
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignupScreen(
    authStore: AuthStore,
    onBack: () -> Unit,
) {
    var displayName by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    val isLoading by authStore.isLoading.collectAsState()
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Criar conta") },
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
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "Preencha os dados para começar",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            )

            OutlinedTextField(
                value = displayName,
                onValueChange = { displayName = it },
                label = { Text("Nome de exibição") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Usuário") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("E-mail") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Senha") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )

            error?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    val validation = validateSignup(displayName, username, email, password)
                    if (validation != null) {
                        error = validation
                        return@Button
                    }
                    scope.launch {
                        error = null
                        try {
                            authStore.register(
                                username = username.trim().lowercase(),
                                email = email.trim().lowercase().replace(" ", ""),
                                password = password,
                                displayName = displayName.trim(),
                            )
                            onBack()
                        } catch (e: Exception) {
                            error = authStore.errorMessage(e)
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.height(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                } else {
                    Text("Cadastrar")
                }
            }
        }
    }
}

private fun validateSignup(
    displayName: String,
    username: String,
    email: String,
    password: String,
): String? {
    val trimmedName = displayName.trim()
    val trimmedUsername = username.trim().lowercase()
    val normalizedEmail = email.trim().lowercase().replace(" ", "")

    if (trimmedName.isEmpty()) return "Informe seu nome de exibição"
    if (trimmedName.length > 50) return "Nome de exibição muito longo"
    if (!Regex("^[a-zA-Z0-9_]{1,15}$").matches(trimmedUsername)) {
        return "Usuário: 1–15 caracteres (letras, números e _)"
    }
    if (normalizedEmail.isEmpty()) return "Informe seu e-mail"
    if (!normalizedEmail.contains("@")) return "O e-mail precisa conter @"
    if (!Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(normalizedEmail)) {
        return "Informe um e-mail válido"
    }
    if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres"
    return null
}