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
    Bookmarks,
    Notifications,
    Messages,
    Grok,
}

/** Ícones modernos e consistentes para a navegação (iOS / Android / Web). */
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
        lineTo(3.25f, 7.65f)
        verticalLineToRelative(11.6f)
        arcToRelative(0.5f, 0.5f, 0f, false, false, 0.5f, 0.5f)
        horizontalLineToRelative(5.45f)
        verticalLineToRelative(-6.75f)
        horizontalLineToRelative(5.6f)
        verticalLineToRelative(6.75f)
        horizontalLineToRelative(5.45f)
        arcToRelative(0.5f, 0.5f, 0f, false, false, 0.5f, -0.5f)
        verticalLineTo(7.65f)
        lineTo(12f, 2.25f)
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
            moveTo(12f, 1.696f)
            lineTo(0.622f, 8.807f)
            lineTo(1.682f, 10.503f)
            lineTo(3f, 9.679f)
            verticalLineToRelative(9.821f)
            arcToRelative(2.5f, 2.5f, 0f, false, false, 2.5f, 2.5f)
            horizontalLineToRelative(13f)
            arcToRelative(2.5f, 2.5f, 0f, false, false, 2.5f, -2.5f)
            verticalLineToRelative(-9.821f)
            lineToRelative(1.318f, 0.824f)
            lineToRelative(1.06f, -1.696f)
            close()
        }
    }.build()
}

private val XSearch: ImageVector by lazy {
    strokePath("XSearch") {
        // Circle: cx=10.5 cy=10.5 r=6.5  -> bounding (4,4)-(17,17)
        arcTo(6.5f, 6.5f, 0f, true, false, 17f, 10.5f)
        arcTo(6.5f, 6.5f, 0f, true, false, 4f, 10.5f)
        // Handle
        moveTo(15.5f, 15.5f)
        lineTo(19.75f, 19.75f)
    }
}

private val XBookmarks: ImageVector by lazy {
    strokePath("XBookmarks") {
        moveTo(4f, 4.5f)
        arcToRelative(2.5f, 2.5f, 0f, false, true, 2.5f, -2.5f)
        horizontalLineToRelative(11f)
        arcToRelative(2.5f, 2.5f, 0f, false, true, 2.5f, 2.5f)
        verticalLineToRelative(17.15f)
        lineToRelative(-8f, -5.6f)
        lineToRelative(-8f, 5.6f)
        close()
    }
}

private val XNotifications: ImageVector by lazy {
    strokePath("XNotifications") {
        moveTo(12f, 2.75f)
        arcToRelative(6.25f, 6.25f, 0f, false, false, -6.25f, 6.25f)
        verticalLineToRelative(3.1f)
        lineToRelative(-1.5f, 2.6f)
        arcToRelative(0.75f, 0.75f, 0f, false, false, 0.65f, 1.125f)
        horizontalLineToRelative(14.2f)
        arcToRelative(0.75f, 0.75f, 0f, false, false, 0.65f, -1.125f)
        lineToRelative(-1.5f, -2.6f)
        verticalLineToRelative(-3.1f)
        arcToRelative(6.25f, 6.25f, 0f, false, false, -6.25f, -6.25f)
        close()
        moveTo(9.5f, 19f)
        arcToRelative(2.5f, 2.5f, 0f, false, false, 5f, 0f)
    }
}

private val XMessages: ImageVector by lazy {
    strokePath("XMessages") {
        moveTo(5.25f, 5f)
        arcToRelative(2.25f, 2.25f, 0f, false, false, -2.25f, 2.25f)
        verticalLineToRelative(8.5f)
        arcToRelative(2.25f, 2.25f, 0f, false, false, 2.25f, 2.25f)
        horizontalLineToRelative(0.25f)
        verticalLineToRelative(2.43f)
        arcToRelative(0.75f, 0.75f, 0f, false, false, 1.15f, 0.59f)
        lineToRelative(3.85f, -3.02f)
        horizontalLineToRelative(10.25f)
        arcToRelative(2.25f, 2.25f, 0f, false, false, 2.25f, -2.25f)
        verticalLineToRelative(-8.5f)
        arcToRelative(2.25f, 2.25f, 0f, false, false, -2.25f, -2.25f)
        close()
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
        // Big sparkle
        path(
            fill = SolidColor(Color.Transparent),
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 1.75f,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ) {
            moveTo(12f, 2f)
            lineToRelative(1.8f, 5.2f)
            arcToRelative(4f, 4f, 0f, false, false, 2.4f, 2.4f)
            lineToRelative(5.2f, 1.4f)
            lineToRelative(-5.2f, 1.4f)
            arcToRelative(4f, 4f, 0f, false, false, -2.4f, 2.4f)
            lineToRelative(-1.8f, 5.2f)
            lineToRelative(-1.8f, -5.2f)
            arcToRelative(4f, 4f, 0f, false, false, -2.4f, -2.4f)
            lineToRelative(-5.2f, -1.4f)
            lineToRelative(5.2f, -1.4f)
            arcToRelative(4f, 4f, 0f, false, false, 2.4f, -2.4f)
            close()
        }
        // Small sparkle
        path(
            fill = SolidColor(Color.Transparent),
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 1.75f,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ) {
            moveTo(19f, 13.5f)
            lineToRelative(0.8f, 2.2f)
            lineToRelative(2.2f, 0.8f)
            lineToRelative(-2.2f, 0.8f)
            lineToRelative(-0.8f, 2.2f)
            lineToRelative(-0.8f, -2.2f)
            lineToRelative(-2.2f, -0.8f)
            lineToRelative(2.2f, -0.8f)
            close()
        }
    }.build()
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
        XNavIconKind.Bookmarks -> XBookmarks
        XNavIconKind.Notifications -> XNotifications
        XNavIconKind.Messages -> XMessages
        XNavIconKind.Grok -> XGrok
    }

    Icon(
        imageVector = icon,
        contentDescription = null,
        modifier = modifier.size(26.dp),
        tint = tint.copy(alpha = if (active) 1f else 0.78f),
    )
}
