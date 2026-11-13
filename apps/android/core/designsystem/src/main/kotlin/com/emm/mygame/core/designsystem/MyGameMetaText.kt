package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameMetaText(text: String, color: Color, modifier: Modifier = Modifier) {
    MyGameMetaText(label = MyGameLabel(text = text, translation = null), color = color, modifier = modifier)
}

@Composable
fun MyGameMetaText(label: MyGameLabel, color: Color, modifier: Modifier = Modifier) {
    MyGameText(
        label = label.uppercase(),
        style = MyGameTypography.meta,
        color = color,
        modifier = modifier.semantics { contentDescription = label.spoken },
    )
}

@PreviewMyGame
@Composable
private fun MyGameMetaTextPreview() {
    MyGamePreviewSurface {
        MyGameMetaText(text = "Town news", color = MyGameTheme.colors.inkMuted)
    }
}
