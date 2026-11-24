package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

internal const val LESSON_BLOCK_LINE: String = "lesson_block_line"

@Composable
internal fun BlockLine(line: MyGameLabel, modifier: Modifier = Modifier) {
    MyGameText(
        label = line,
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.warningInk,
        modifier = modifier.semantics {
            hideFromAccessibility()
            testTag = LESSON_BLOCK_LINE
        },
    )
}
