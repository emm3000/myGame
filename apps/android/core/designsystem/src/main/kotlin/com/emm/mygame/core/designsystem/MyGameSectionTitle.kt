package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameSectionTitle(text: String, modifier: Modifier = Modifier) {
    MyGameText(
        text = text,
        style = MyGameTypography.label,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.semantics { heading() },
    )
}
