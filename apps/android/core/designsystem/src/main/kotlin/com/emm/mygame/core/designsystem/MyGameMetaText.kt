package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameMetaText(text: String, color: Color, modifier: Modifier = Modifier) {
    MyGameText(
        text = text.uppercase(),
        style = MyGameTypography.meta,
        color = color,
        modifier = modifier.semantics { contentDescription = text },
    )
}
