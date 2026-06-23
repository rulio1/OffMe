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

/**
 * Ícones de ação modernos e consistentes (iOS / Android / Web).
 * Design 2024 com traços limpos, cantos arredondados e estados outline/filled.
 */
private fun actionPath(
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

/** Catálogo de ícones de ação usados nos posts. */
object ActionIcons {
    val Reply: ImageVector by lazy {
        actionPath("ActionReply") {
            moveTo(1.751f, 10f)
            curveTo(1.751f, 5.58f, 5.335f, 2f, 9.756f, 2f)
            horizontalLineToRelative(4.366f)
            curveTo(18.612f, 2f, 22.251f, 5.64f, 22.251f, 10.13f)
            curveTo(22.251f, 13.09f, 20.644f, 15.83f, 18.055f, 17.24f)
            lineTo(10.001f, 21.7f)
            verticalLineToRelative(-3.69f)
            horizontalLineToRelative(-0.067f)
            curveTo(5.444f, 18.11f, 1.751f, 14.5f, 1.751f, 10f)
            close()
            moveTo(9.756f, 4f)
            curveTo(6.439f, 4f, 3.751f, 6.69f, 3.751f, 10f)
            curveTo(3.751f, 13.37f, 6.521f, 16.08f, 9.889f, 16.01f)
            lineTo(10.24f, 16f)
            horizontalLineToRelative(1.761f)
            verticalLineToRelative(2.3f)
            lineToRelative(5.087f, -2.81f)
            curveTo(19.039f, 14.41f, 20.251f, 12.36f, 20.251f, 10f)
            curveTo(20.251f, 6.74f, 17.507f, 4f, 14.122f, 4f)
            horizontalLineTo(9.756f)
            close()
        }
    }

    val Repost: ImageVector by lazy {
        actionPath("ActionRepost") {
            moveTo(4.5f, 3.88f)
            lineTo(8.932f, 8.02f)
            lineTo(7.568f, 9.48f)
            lineTo(5.5f, 7.55f)
            verticalLineTo(16f)
            curveTo(5.5f, 17.1f, 6.396f, 18f, 7.5f, 18f)
            horizontalLineTo(13f)
            verticalLineTo(20f)
            horizontalLineTo(7.5f)
            curveTo(5.291f, 20f, 3.5f, 18.21f, 3.5f, 16f)
            verticalLineTo(7.55f)
            lineTo(1.432f, 9.48f)
            lineTo(0.068f, 8.02f)
            lineTo(4.5f, 3.88f)
            close()

            moveTo(16.5f, 6f)
            horizontalLineTo(11f)
            verticalLineTo(4f)
            horizontalLineTo(16.5f)
            curveTo(18.709f, 4f, 20.5f, 5.79f, 20.5f, 8f)
            verticalLineTo(16.45f)
            lineTo(22.568f, 14.52f)
            lineTo(23.932f, 15.98f)
            lineTo(19.5f, 20.12f)
            lineTo(15.068f, 15.98f)
            lineTo(16.432f, 14.52f)
            lineTo(18.5f, 16.45f)
            verticalLineTo(8f)
            curveTo(18.5f, 6.9f, 17.604f, 6f, 16.5f, 6f)
            close()
        }
    }

    val HeartFilled: ImageVector by lazy {
        actionPath("ActionHeartFilled") {
            moveTo(20.884f, 13.19f)
            curveTo(16.883f, 18.31f, 14.233f, 15.67f, 12.505f, 20.86f)
            lineTo(12.002f, 21.16f)
            lineTo(11.499f, 20.86f)
            curveTo(9.727f, 15.67f, 7.077f, 18.31f, 3.118f, 13.19f)
            curveTo(2.428f, 12.33f, 1.751f, 11.17f, 1.751f, 10f)
            curveTo(1.751f, 6f, 3.861f, 4.17f, 6.352f, 3.88f)
            curveTo(8.515f, 3.79f, 10.232f, 4.44f, 12.002f, 5.89f)
            curveTo(13.772f, 4.44f, 15.489f, 3.79f, 17.652f, 3.88f)
            curveTo(20.143f, 4.17f, 22.253f, 6f, 22.253f, 6.89f)
            curveTo(22.253f, 8.37f, 22.203f, 10.73f, 20.884f, 13.19f)
            close()
        }
    }

    val HeartOutline: ImageVector by lazy {
        actionPath("ActionHeartOutline") {
            moveTo(16.697f, 5.5f)
            curveTo(15.018f, 5.44f, 13.591f, 6.05f, 12.807f, 7.66f)
            lineTo(12.002f, 8.75f)
            lineTo(11.196f, 7.66f)
            curveTo(10.413f, 6.01f, 8.986f, 5.44f, 7.304f, 5.5f)
            curveTo(6.061f, 5.57f, 4.955f, 6.28f, 4.394f, 7.41f)
            curveTo(3.834f, 8.53f, 3.915f, 10.19f, 4.873f, 12.23f)
            curveTo(6.13f, 16.5f, 8.312f, 18.8f, 12.002f, 18.84f)
            curveTo(13.692f, 18.8f, 15.874f, 16.5f, 19.128f, 12.23f)
            curveTo(20.054f, 10.03f, 20.973f, 8.37f, 20.884f, 13.19f)
            curveTo(22.244f, 15.69f, 22.294f, 18.05f, 21.433f, 18.02f)
            curveTo(16.433f, 18.31f, 14.233f, 15.67f, 12.505f, 20.86f)
            lineTo(12.002f, 21.16f)
            lineTo(11.499f, 20.86f)
            curveTo(9.727f, 15.67f, 7.077f, 18.31f, 3.118f, 13.19f)
            curveTo(2.428f, 12.33f, 1.751f, 11.17f, 1.751f, 10f)
            curveTo(1.751f, 6f, 3.861f, 4.17f, 6.352f, 3.88f)
            curveTo(8.515f, 3.79f, 10.232f, 4.44f, 12.002f, 5.89f)
            curveTo(13.772f, 4.44f, 15.489f, 3.79f, 17.652f, 3.88f)
            curveTo(20.143f, 4.17f, 22.253f, 6f, 22.253f, 6.89f)
            curveTo(22.253f, 8.37f, 22.203f, 10.73f, 20.884f, 13.19f)
            close()
        }
    }

    val Views: ImageVector by lazy {
        actionPath("ActionViews") {
            moveTo(8.75f, 3f)
            horizontalLineToRelative(2f)
            verticalLineToRelative(18f)
            horizontalLineToRelative(-2f)
            close()
            moveTo(18f, 8f)
            horizontalLineToRelative(2f)
            verticalLineToRelative(13f)
            horizontalLineToRelative(-2f)
            close()
            moveTo(4.004f, 11f)
            horizontalLineToRelative(2f)
            verticalLineToRelative(10f)
            horizontalLineToRelative(-2f)
            close()
            moveTo(13.248f, 14f)
            horizontalLineToRelative(2f)
            verticalLineToRelative(7f)
            horizontalLineToRelative(-2f)
            close()
        }
    }

    val Share: ImageVector by lazy {
        actionPath("ActionShare") {
            moveTo(12f, 2.59f)
            lineTo(17.7f, 8.29f)
            lineTo(16.29f, 9.71f)
            lineTo(13f, 6.41f)
            verticalLineTo(16f)
            horizontalLineToRelative(-2f)
            verticalLineTo(6.41f)
            lineTo(7.71f, 9.71f)
            lineTo(6.29f, 8.29f)
            close()
            moveTo(21f, 15f)
            lineTo(20.98f, 18.51f)
            curveTo(20.98f, 19.62f, 19.86f, 21f, 18.5f, 21f)
            horizontalLineTo(5.5f)
            curveTo(4.11f, 21f, 3f, 19.88f, 3f, 18.5f)
            verticalLineTo(15f)
            horizontalLineToRelative(2f)
            verticalLineToRelative(3.5f)
            curveTo(5f, 18.78f, 5.22f, 19f, 5.5f, 19f)
            horizontalLineTo(18.48f)
            curveTo(18.76f, 19f, 18.98f, 18.78f, 18.98f, 18.5f)
            lineTo(19f, 15f)
            close()
        }
    }

    val BookmarkFilled: ImageVector by lazy {
        actionPath("ActionBookmarkFilled") {
            moveTo(4f, 4.5f)
            curveTo(4f, 3.12f, 5.119f, 2f, 6.5f, 2f)
            horizontalLineTo(17.5f)
            curveTo(18.881f, 2f, 20f, 3.12f, 20f, 4.5f)
            verticalLineTo(22.94f)
            lineTo(12f, 17.23f)
            lineTo(4f, 22.94f)
            close()
        }
    }

    val BookmarkOutline: ImageVector by lazy {
        actionPath("ActionBookmarkOutline") {
            moveTo(4f, 4.5f)
            curveTo(4f, 3.12f, 5.119f, 2f, 6.5f, 2f)
            horizontalLineTo(17.5f)
            curveTo(18.881f, 2f, 20f, 3.12f, 20f, 4.5f)
            verticalLineTo(22.94f)
            lineTo(12f, 17.23f)
            lineTo(4f, 22.94f)
            close()
            moveTo(6.5f, 4f)
            curveTo(6.224f, 4f, 6f, 4.22f, 6f, 4.5f)
            verticalLineTo(19.06f)
            lineTo(12f, 14.77f)
            lineTo(18f, 19.06f)
            verticalLineTo(4.5f)
            curveTo(18f, 4.22f, 17.776f, 4f, 17.5f, 4f)
            horizontalLineTo(6.5f)
            close()
        }
    }
}

/** Composable helper para renderizar um ícone de ação. */
@Composable
fun ActionIcon(
    icon: ImageVector,
    modifier: Modifier = Modifier,
    tint: Color = Color.Unspecified,
    size: androidx.compose.ui.unit.Dp = 18.dp,
) {
    Icon(
        imageVector = icon,
        contentDescription = null,
        tint = tint,
        modifier = modifier.size(size),
    )
}
