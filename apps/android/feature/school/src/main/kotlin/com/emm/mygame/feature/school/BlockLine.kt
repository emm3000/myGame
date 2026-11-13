package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

internal const val LESSON_BLOCK_LINE: String = "lesson_block_line"

@Composable
internal fun BlockLine(line: String, modifier: Modifier = Modifier) {
    MyGameText(
        text = line,
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.warningInk,
        modifier = modifier.semantics {
            hideFromAccessibility()
            testTag = LESSON_BLOCK_LINE
        },
    )
}

@Composable
internal fun blockLineOf(block: SchoolUiState.LessonBlock): String = when (block) {
    is SchoolUiState.LessonBlock.SlotBusy -> slotBusyLineOf(block.name)
    is SchoolUiState.LessonBlock.SchoolTooLow ->
        icuStringResource(R.string.school_lesson_needs_school, "level" to block.requiredLevel.toString())
    is SchoolUiState.LessonBlock.CapReached -> icuStringResource(
        R.string.school_lesson_cap_reached,
        "inLearning" to block.inLearning.toString(),
        "cap" to block.cap.toString(),
        "count" to block.wordCount.toString(),
    )
}
