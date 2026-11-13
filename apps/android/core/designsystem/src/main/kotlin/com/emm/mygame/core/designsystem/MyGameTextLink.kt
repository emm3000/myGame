package com.emm.mygame.core.designsystem

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextDecoration

@Composable
fun MyGameTextLink(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(label = MyGameLabel(text = label, translation = null), onClick = onClick, modifier = modifier)
}

@Composable
fun MyGameTextLink(label: MyGameLabel, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameTextTarget(isEnabled = true, onClick = onClick, modifier = modifier) {
        MyGameText(
            label = label,
            style = MyGameTypography.button.copy(textDecoration = TextDecoration.Underline),
            color = MyGameTheme.colors.action,
        )
    }
}

@Composable
internal fun MyGameTextTarget(
    isEnabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(
        contentAlignment = Alignment.CenterStart,
        modifier = modifier
            .defaultMinSize(minWidth = MyGameSizes.control, minHeight = MyGameSizes.control)
            .clickable(enabled = isEnabled, role = Role.Button, onClick = onClick),
    ) {
        content()
    }
}

@PreviewMyGame
@Composable
private fun MyGameTextLinkPreview() {
    MyGamePreviewSurface {
        MyGameTextLink(label = "Open the map", onClick = {})
    }
}
