package com.offme.ui.settings

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.offme.data.auth.AuthStore

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsHubScreen(
    authStore: AuthStore,
    onBack: () -> Unit,
    onVerification: () -> Unit,
    onLists: () -> Unit,
    onCommunities: () -> Unit,
    onLogout: () -> Unit,
) {
    val session by authStore.session.collectAsState()
    val context = LocalContext.current
    val username = session?.user?.username

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configurações") },
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
            Button(onClick = onVerification, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Verified, contentDescription = null)
                Spacer(Modifier.height(0.dp))
                Text("Verificação", modifier = Modifier.padding(start = 8.dp))
            }
            Spacer(Modifier.height(8.dp))
            Button(onClick = onLists, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.List, contentDescription = null)
                Text("Listas", modifier = Modifier.padding(start = 8.dp))
            }
            Spacer(Modifier.height(8.dp))
            Button(onClick = onCommunities, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Groups, contentDescription = null)
                Text("Comunidades", modifier = Modifier.padding(start = 8.dp))
            }

            Spacer(Modifier.height(16.dp))
            HorizontalDivider()
            Spacer(Modifier.height(16.dp))

            Button(
                onClick = {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://offme.vercel.app/settings"))
                    context.startActivity(intent)
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Configurações completas (web)")
            }

            if (username != null) {
                Spacer(Modifier.height(16.dp))
                Text("Convidar amigos", style = MaterialTheme.typography.titleSmall)
                val invite = "https://offme.vercel.app/signup?ref=$username"
                Text(invite, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        val share = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, invite)
                        }
                        context.startActivity(Intent.createChooser(share, "Compartilhar convite"))
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Compartilhar convite")
                }
            }

            Spacer(Modifier.weight(1f))
            Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                Text("Sair")
            }
        }
    }
}