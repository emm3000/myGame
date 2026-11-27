package com.emm.mygame.feature.learning.reviews

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

@Composable
internal fun Prompt(text: String, modifier: Modifier = Modifier) {
    MyGameText(text = text, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted, modifier = modifier)
}
