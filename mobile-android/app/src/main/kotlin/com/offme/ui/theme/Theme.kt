package com.offme.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val OffMeColors = darkColorScheme(
    primary = Color(0xFF1D9BF0),
    onPrimary = Color.White,
    surface = Color(0xFF000000),
    onSurface = Color(0xFFE7E9EA),
    outline = Color(0xFF2F3336),
)

@Composable
fun OffMeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = OffMeColors,
        content = content,
    )
}