package com.offme.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.offme.data.api.ApiClient
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

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
    var scheduledAt by remember { mutableStateOf<LocalDateTime?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val canSchedule = replyToId == null

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

            if (canSchedule) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = { showDatePicker = true }) {
                        Icon(Icons.Default.Schedule, contentDescription = "Agendar")
                    }
                    Text(
                        text = scheduledAt?.let {
                            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(it)
                        } ?: "Publicar agora",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    )
                    if (scheduledAt != null) {
                        TextButton(onClick = { scheduledAt = null }) {
                            Text("Limpar")
                        }
                    }
                }
            }

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
                            val iso = scheduledAt?.atZone(ZoneId.systemDefault())
                                ?.withZoneSameInstant(ZoneOffset.UTC)
                                ?.toInstant()
                                ?.toString()
                            api.createPost(token, trimmed, replyToId, communityId, iso)
                            text = ""
                            scheduledAt = null
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
                Text(
                    when {
                        posting -> "Publicando..."
                        scheduledAt != null -> "Agendar"
                        else -> "Publicar"
                    },
                )
            }
        }
    }

    if (showDatePicker) {
        val dateState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val millis = dateState.selectedDateMillis ?: return@TextButton
                    val date = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDate()
                    val time = scheduledAt?.toLocalTime() ?: LocalTime.now().plusHours(1)
                    scheduledAt = LocalDateTime.of(date, time)
                    showDatePicker = false
                    showTimePicker = true
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancelar") }
            },
        ) {
            DatePicker(state = dateState)
        }
    }

    if (showTimePicker) {
        val timeState = rememberTimePickerState(
            initialHour = scheduledAt?.hour ?: LocalTime.now().plusHours(1).hour,
            initialMinute = scheduledAt?.minute ?: 0,
        )
        DatePickerDialog(
            onDismissRequest = { showTimePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val date = scheduledAt?.toLocalDate() ?: LocalDate.now()
                    scheduledAt = LocalDateTime.of(date, LocalTime.of(timeState.hour, timeState.minute))
                    showTimePicker = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) { Text("Cancelar") }
            },
        ) {
            TimePicker(state = timeState)
        }
    }
}