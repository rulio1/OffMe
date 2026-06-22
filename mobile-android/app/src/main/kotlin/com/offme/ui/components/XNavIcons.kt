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
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

enum class XNavIconKind {
    Home,
    Search,
    Bookmarks,
    Notifications,
    Messages,
    Profile,
    More,
    Lists,
    Communities,
    Settings,
}

/** Ícones modernos e consistentes para a navegação (iOS / Android / Web). */
private fun strokePath(
    name: String,
    width: Float = 1.75f,
    block: PathBuilder.() -> Unit,
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

private fun filledPath(
    name: String,
    block: PathBuilder.() -> Unit,
): ImageVector = ImageVector.Builder(
    name = name,
    defaultWidth = 24.dp,
    defaultHeight = 24.dp,
    viewportWidth = 24f,
    viewportHeight = 24f,
).apply {
    path(
        fill = SolidColor(Color.Black),
        block = block,
    )
}.build()

/** Desenha um círculo completo usando dois arcos (cx, cy, raio). */
private fun PathBuilder.circle(cx: Float, cy: Float, r: Float) {
    moveTo(cx + r, cy)
    arcTo(r, r, 0f, true, false, cx - r, cy)
    arcTo(r, r, 0f, true, false, cx + r, cy)
    close()
}

private val XHomeOutline: ImageVector by lazy {
    strokePath("XHomeOutline") {
        moveTo(12f, 2.25f)
        lineTo(3.25f, 7.65f)
        verticalLineToRelative(11.6f)
        arcTo(0.5f, 0.5f, 0f, false, false, 3.75f, 19.75f)
        horizontalLineTo(9.2f)
        verticalLineToRelative(-6.75f)
        horizontalLineToRelative(5.6f)
        verticalLineToRelative(6.75f)
        horizontalLineToRelative(5.45f)
        arcTo(0.5f, 0.5f, 0f, false, false, 20.75f, 19.25f)
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
            arcTo(2.5f, 2.5f, 0f, false, false, 5.5f, 22f)
            horizontalLineToRelative(13f)
            arcTo(2.5f, 2.5f, 0f, false, false, 21f, 19.5f)
            verticalLineToRelative(-9.821f)
            lineTo(22.318f, 10.503f)
            lineTo(23.378f, 8.807f)
            close()
        }
    }.build()
}

private val XSearch: ImageVector by lazy {
    strokePath("XSearch") {
        // Circle: cx=10.5 cy=10.5 r=6.5 -> bounding (4,4)-(17,17)
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
        arcTo(2.5f, 2.5f, 0f, false, true, 6.5f, 2f)
        horizontalLineTo(17.5f)
        arcTo(2.5f, 2.5f, 0f, false, true, 20f, 4.5f)
        verticalLineToRelative(17.15f)
        lineTo(12f, 16.05f)
        lineTo(4f, 21.65f)
        close()
    }
}

private val XNotifications: ImageVector by lazy {
    strokePath("XNotifications") {
        moveTo(12f, 2.75f)
        arcTo(6.25f, 6.25f, 0f, false, false, 5.75f, 9f)
        verticalLineToRelative(3.1f)
        lineTo(4.25f, 14.7f)
        arcTo(0.75f, 0.75f, 0f, false, false, 4.9f, 15.825f)
        horizontalLineTo(19.1f)
        arcTo(0.75f, 0.75f, 0f, false, false, 19.75f, 14.7f)
        lineTo(18.25f, 12.1f)
        verticalLineTo(9f)
        arcTo(6.25f, 6.25f, 0f, false, false, 12f, 2.75f)
        close()
        moveTo(9.5f, 19f)
        arcTo(2.5f, 2.5f, 0f, false, false, 14.5f, 19f)
    }
}

private val XMessages: ImageVector by lazy {
    strokePath("XMessages") {
        moveTo(1.99f, 7.75f)
        arcTo(2.25f, 2.25f, 0f, false, true, 4.24f, 5.5f)
        horizontalLineTo(19.75f)
        arcTo(2.25f, 2.25f, 0f, false, true, 22f, 7.75f)
        verticalLineToRelative(8.5f)
        arcTo(2.25f, 2.25f, 0f, false, True, 19.75f, 18.5f)
        horizontalLineTo(9.5f)
        lineTo(5.65f, 21.52f)
        arcTo(0.75f, 0.75f, 0f, false, True, 4.5f, 20.93f)
        verticalLineTo(18.5f)
        horizontalLineTo(4.24f)
        arcTo(2.25f, 2.25f, 0f, false, True, 1.99f, 16.25f)
        close()
    }
}

private val XProfile: ImageVector by lazy {
    strokePath("XProfile") {
        circle(cx = 12f, cy = 7.5f, r = 3.75f)
        moveTo(3.75f, 19.5f)
        arcTo(8.25f, 8.25f, 0f, false, true, 20.25f, 19.5f)
    }
}

private val XProfileFilled: ImageVector by lazy {
    filledPath("XProfileFilled") {
        circle(cx = 12f, cy = 7.5f, r = 3.75f)
        moveTo(3.75f, 19.5f)
        arcTo(8.25f, 8.25f, 0f, false, true, 20.25f, 19.5f)
        lineTo(3.75f, 19.5f)
    }
}

private val XMore: ImageVector by lazy {
    filledPath("XMore") {
        circle(cx = 5f, cy = 12f, r = 1.6f)
        circle(cx = 12f, cy = 12f, r = 1.6f)
        circle(cx = 19f, cy = 12f, r = 1.6f)
    }
}

private val XLists: ImageVector by lazy {
    strokePath("XLists") {
        moveTo(4f, 6f)
        horizontalLineTo(15f)
        moveTo(4f, 12f)
        horizontalLineTo(15f)
        moveTo(4f, 18f)
        horizontalLineTo(15f)
        circle(cx = 19f, cy = 6f, r = 0.9f)
        circle(cx = 19f, cy = 12f, r = 0.9f)
        circle(cx = 19f, cy = 18f, r = 0.9f)
    }
}

private val XCommunities: ImageVector by lazy {
    strokePath("XCommunities") {
        circle(cx = 7.5f, cy = 9f, r = 3.25f)
        circle(cx = 16.5f, cy = 9f, r = 3.25f)
        moveTo(2.5f, 19f)
        arcTo(5f, 5f, 0f, false, true, 12.5f, 19f)
        moveTo(11.5f, 19f)
        arcTo(5f, 5f, 0f, false, True, 21.5f, 19f)
    }
}

private val XSettings: ImageVector by lazy {
    strokePath("XSettings") {
        circle(cx = 12f, cy = 12f, r = 3f)
        moveTo(12f, 1.5f)
        verticalLineTo(4.5f)
        moveTo(12f, 19.5f)
        verticalLineTo(22.5f)
        moveTo(22.5f, 12f)
        horizontalLineTo(19.5f)
        moveTo(4.5f, 12f)
        horizontalLineTo(1.5f)
        moveTo(19.07f, 4.93f)
        lineTo(16.95f, 7.05f)
        moveTo(7.05f, 16.95f)
        lineTo(4.93f, 19.07f)
        moveTo(19.07f, 19.07f)
        lineTo(16.95f, 16.95f)
        moveTo(7.05f, 7.05f)
        lineTo(4.93f, 4.93f)
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
        XNavIconKind.Bookmarks -> XBookmarks
        XNavIconKind.Notifications -> XNotifications
        XNavIconKind.Messages -> XMessages
        XNavIconKind.Profile -> if (active) XProfileFilled else XProfile
        XNavIconKind.More -> XMore
        XNavIconKind.Lists -> XLists
        XNavIconKind.Communities -> XCommunities
        XNavIconKind.Settings -> XSettings
    }

    Icon(
        imageVector = icon,
        contentDescription = null,
        modifier = modifier.size(26.dp),
        tint = tint.copy(alpha = if (active) 1f else 0.78f),
    )
}