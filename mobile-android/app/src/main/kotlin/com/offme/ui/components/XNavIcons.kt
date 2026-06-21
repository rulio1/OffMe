package com.offme.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

enum class XNavIconKind {
    Home,
    Search,
    Grok,
    Notifications,
    Messages,
}

private fun strokePath(
    name: String,
    width: Float = 1.75f,
    block: androidx.compose.ui.graphics.vector.PathBuilder.() -> Unit,
): ImageVector = ImageVector.Builder(
    name = name,
    defaultWidth = 24.dp,
    defaultHeight = 24.dp,
    viewportWidth = 24f,
    viewportHeight = 24f,
).apply {
    path(
        fill = SolidColor(Color.Transparent),
        stroke = SolidColor(Color.Black),
        strokeLineWidth = width,
        strokeLineCap = StrokeCap.Round,
        strokeLineJoin = StrokeJoin.Round,
        block = block,
    )
}.build()

private val XHomeOutline: ImageVector by lazy {
    strokePath("XHomeOutline") {
        moveTo(12f, 2.25f)
        lineTo(3.75f, 7.5f)
        verticalLineToRelative(12.75f)
        horizontalLineToRelative(5.25f)
        verticalLineToRelative(-6.75f)
        horizontalLineToRelative(6f)
        verticalLineToRelative(6.75f)
        horizontalLineToRelative(5.25f)
        verticalLineTo(7.5f)
        close()
    }
}

private val XHomeFilled: ImageVector by lazy {
    ImageVector.Builder(
        name = "XHomeFilled",
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f,
    ).apply {
        path {
            moveTo(21.591f, 7.146f)
            lineTo(12f, 1.88f)
            lineTo(2.409f, 7.146f)
            verticalLineToRelative(12.879f)
            horizontalLineToRelative(6.481f)
            verticalLineToRelative(-6.525f)
            horizontalLineToRelative(5.826f)
            verticalLineToRelative(6.525f)
            horizontalLineToRelative(6.481f)
            verticalLineTo(7.146f)
            close()
        }
    }.build()
}

private val XSearch: ImageVector by lazy {
    strokePath("XSearch") {
        moveTo(10.25f, 3.75f)
        arcTo(6.5f, 6.5f, 0f, true, false, 10.25f, 16.75f)
        moveTo(16.25f, 16.25f)
        lineTo(20.25f, 20.25f)
    }
}

private val XGrok: ImageVector by lazy {
    ImageVector.Builder(
        name = "XGrok",
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f,
    ).apply {
        path(
            fill = SolidColor(Color.Transparent),
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 1.75f,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ) {
            moveTo(12f, 3.5f)
            verticalLineToRelative(3.25f)
            moveTo(12f, 17.25f)
            verticalLineToRelative(3.25f)
            moveTo(4.75f, 12f)
            horizontalLineToRelative(3.25f)
            moveTo(16f, 12f)
            horizontalLineToRelative(3.25f)
            moveTo(6.4f, 6.4f)
            lineToRelative(2.3f, 2.3f)
            moveTo(15.3f, 15.3f)
            lineToRelative(2.3f, 2.3f)
            moveTo(17.6f, 6.4f)
            lineToRelative(-2.3f, 2.3f)
            moveTo(8.7f, 15.3f)
            lineToRelative(-2.3f, 2.3f)
        }
        path {
            moveTo(12f, 9.65f)
            arcTo(2.35f, 2.35f, 0f, true, false, 12f, 14.35f)
            arcTo(2.35f, 2.35f, 0f, true, false, 12f, 9.65f)
            close()
        }
    }.build()
}

private val XNotifications: ImageVector by lazy {
    strokePath("XNotifications") {
        moveTo(12f, 3.25f)
        arcToRelative(5.75f, 5.75f, 0f, false, false, -5.75f, 5.75f)
        verticalLineToRelative(4.1f)
        lineToRelative(-1.4f, 2.1f)
        horizontalLineToRelative(14.3f)
        lineToRelative(-1.4f, -2.1f)
        verticalLineToRelative(-4.1f)
        arcToRelative(5.75f, 5.75f, 0f, false, false, -5.75f, -5.75f)
        close()
        moveTo(9.25f, 18.5f)
        arcToRelative(2.75f, 2.75f, 0f, false, false, 5.5f, 0f)
    }
}

private val XMessages: ImageVector by lazy {
    strokePath("XMessages") {
        moveTo(4.5f, 5.75f)
        horizontalLineToRelative(15f)
        arcToRelative(1.25f, 1.25f, 0f, false, true, 1.25f, 1.25f)
        verticalLineToRelative(8.5f)
        arcToRelative(1.25f, 1.25f, 0f, false, true, -1.25f, 1.25f)
        horizontalLineToRelative(-10.3f)
        lineToRelative(-3.95f, 2.75f)
        verticalLineToRelative(-2.75f)
        horizontalLineToRelative(-0.75f)
        arcToRelative(1.25f, 1.25f, 0f, false, true, -1.25f, -1.25f)
        verticalLineToRelative(-8.5f)
        arcToRelative(1.25f, 1.25f, 0f, false, true, 1.25f, -1.25f)
        close()
    }
}

@Composable
fun XNavIcon(
    kind: XNavIconKind,
    active: Boolean,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    val icon = when (kind) {
        XNavIconKind.Home -> if (active) XHomeFilled else XHomeOutline
        XNavIconKind.Search -> XSearch
        XNavIconKind.Grok -> XGrok
        XNavIconKind.Notifications -> XNotifications
        XNavIconKind.Messages -> XMessages
    }

    Icon(
        imageVector = icon,
        contentDescription = null,
        modifier = modifier.size(26.dp),
        tint = tint.copy(alpha = if (active) 1f else 0.78f),
    )
}