package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameNextStepBlock(
    title: String,
    line: String,
    detail: String?,
    modifier: Modifier = Modifier,
    countdown: @Composable () -> Unit = {},
) {
    MyGameBlock(
        hue = MyGameBlockHue.Peach,
        modifier = modifier.semantics(mergeDescendants = true) { },
    ) {
        MyGameMetaText(
            text = title,
            color = MyGameTheme.colors.onBlockMuted,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(text = line, style = MyGameTypography.display, color = MyGameTheme.colors.onBlock)
        detail?.let { shown: String ->
            MyGameText(text = shown, style = MyGameTypography.body, color = MyGameTheme.colors.onBlock)
        }
        countdown()
    }
}
