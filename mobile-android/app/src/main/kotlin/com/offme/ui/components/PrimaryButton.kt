package com.offme.ui.components

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

enum class ButtonVariant {
    Filled, Outline, Ghost, Destructive, Success
}

enum class ButtonSize {
    Small, Medium, Large
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Filled,
    size: ButtonSize = ButtonSize.Medium,
    isLoading: Boolean = false,
    isDisabled: Boolean = false,
    leadingIcon: (@Composable () -> Unit)? = null,
    trailingIcon: (@Composable () -> Unit)? = null,
) {
    val buttonColors = when (variant) {
        ButtonVariant.Filled -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary
        )
        ButtonVariant.Outline -> ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.primary
        )
        ButtonVariant.Ghost -> ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            contentColor = MaterialTheme.colorScheme.primary
        )
        ButtonVariant.Destructive -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
            contentColor = MaterialTheme.colorScheme.onError
        )
        ButtonVariant.Success -> ButtonDefaults.buttonColors(
            containerColor = Color(0xFF00BA7C),
            contentColor = Color.White
        )
    }

    val contentPadding = when (size) {
        ButtonSize.Small -> PaddingValues(horizontal = 12.dp, vertical = 6.dp)
        ButtonSize.Medium -> PaddingValues(horizontal = 16.dp, vertical = 10.dp)
        ButtonSize.Large -> PaddingValues(horizontal = 20.dp, vertical = 14.dp)
    }

    val buttonModifier = modifier.then(
        if (variant == ButtonVariant.Outline) {
            Modifier
        } else {
            Modifier
        }
    )

    if (variant == ButtonVariant.Outline) {
        OutlinedButton(
            onClick = onClick,
            enabled = !isDisabled && !isLoading,
            colors = buttonColors,
            shape = RoundedCornerShape(8.dp),
            contentPadding = contentPadding,
            modifier = buttonModifier
        ) {
            ButtonContent(
                text = text,
                isLoading = isLoading,
                leadingIcon = leadingIcon,
                trailingIcon = trailingIcon,
                size = size
            )
        }
    } else {
        Button(
            onClick = onClick,
            enabled = !isDisabled && !isLoading,
            colors = buttonColors,
            shape = RoundedCornerShape(8.dp),
            contentPadding = contentPadding,
            modifier = buttonModifier
        ) {
            ButtonContent(
                text = text,
                isLoading = isLoading,
                leadingIcon = leadingIcon,
                trailingIcon = trailingIcon,
                size = size
            )
        }
    }
}

@Composable
private fun RowScope.ButtonContent(
    text: String,
    isLoading: Boolean,
    leadingIcon: (@Composable () -> Unit)?,
    trailingIcon: (@Composable () -> Unit)?,
    size: ButtonSize
) {
    if (isLoading) {
        CircularProgressIndicator(
            strokeWidth = 2.dp,
            modifier = Modifier.padding(end = if (trailingIcon != null) 8.dp else 0.dp)
        )
    } else {
        if (leadingIcon != null) {
            leadingIcon()
        }

        Text(
            text = text,
            style = when (size) {
                ButtonSize.Small -> MaterialTheme.typography.labelLarge
                ButtonSize.Medium -> MaterialTheme.typography.bodyLarge
                ButtonSize.Large -> MaterialTheme.typography.titleMedium
            }
        )

        if (trailingIcon != null) {
            trailingIcon()
        }
    }
}