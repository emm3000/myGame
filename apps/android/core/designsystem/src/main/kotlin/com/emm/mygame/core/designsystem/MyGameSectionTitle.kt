package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameSectionTitle(text: String, modifier: Modifier = Modifier) {
    MyGameSectionTitle(label = MyGameLabel(text = text, translation = null), modifier = modifier)
}

@Composable
fun MyGameSectionTitle(label: MyGameLabel, modifier: Modifier = Modifier) {
    MyGameText(
        label = label,
        style = MyGameTypography.label,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.semantics(mergeDescendants = label.translation != null) { heading() },
    )
}

@PreviewMyGame
@Composable
private fun MyGameSectionTitlePreview() {
    MyGamePreviewSurface {
        MyGameSectionTitle(text = "Places")
        MyGameSectionTitle(label = MyGameLabel(text = "Places", translation = "Lugares"))
    }
}
