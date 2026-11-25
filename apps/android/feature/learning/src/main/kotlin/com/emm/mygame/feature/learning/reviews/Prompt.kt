package com.emm.mygame.feature.learning.reviews

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
internal fun Prompt(text: String, modifier: Modifier = Modifier) {
    MyGameText(text = text, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted, modifier = modifier)
}
