package com.offme.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object Formatters {
    fun count(n: Int): String = when {
        n >= 1_000_000 -> String.format(Locale.US, "%.1fM", n / 1_000_000.0)
        n >= 1_000 -> String.format(Locale.US, "%.1fK", n / 1_000.0)
        else -> n.toString()
    }

    fun timeAgo(epochMillis: Long): String {
        val now = System.currentTimeMillis()
        val then = if (epochMillis > 9_999_999_999L) epochMillis else epochMillis * 1000
        val diff = (now - then).coerceAtLeast(0)

        val minutes = TimeUnit.MILLISECONDS.toMinutes(diff)
        val hours = TimeUnit.MILLISECONDS.toHours(diff)
        val days = TimeUnit.MILLISECONDS.toDays(diff)

        return when {
            minutes < 1 -> "agora"
            minutes < 60 -> "${minutes}min"
            hours < 24 -> "${hours}h"
            days < 7 -> "${days}d"
            else -> SimpleDateFormat("d MMM", Locale("pt", "BR")).format(Date(then))
        }
    }
}