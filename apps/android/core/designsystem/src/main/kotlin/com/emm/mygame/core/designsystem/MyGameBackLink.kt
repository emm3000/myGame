package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun MyGameBackLink(label: String, isEnabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameBackLink(
        label = MyGameLabel(text = label, translation = null),
        isEnabled = isEnabled,
        onClick = onClick,
        modifier = modifier,
    )
}

@Composable
fun MyGameBackLink(label: MyGameLabel, isEnabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    MyGameTextTarget(isEnabled = isEnabled, onClick = onClick, modifier = modifier) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MyGameIcon(icon = MyGameIcons.back, tint = colors.inkMuted)
            MyGameMetaText(label = label, color = colors.inkMuted)
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameBackLinkPreview() {
    MyGamePreviewSurface {
        MyGameBackLink(label = "Town", isEnabled = true, onClick = {})
        MyGameBackLink(label = "Town", isEnabled = false, onClick = {})
    }
}
