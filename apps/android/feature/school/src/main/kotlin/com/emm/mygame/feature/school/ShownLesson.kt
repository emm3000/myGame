package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.ui.icuStringResource

internal const val LESSON_BLOCK_LINE: String = "lesson_block_line"

@Composable
internal fun ShownLesson(
    card: SchoolUiState.LessonCard,
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val running: SchoolUiState.SlotLine.Running? = content.slot as? SchoolUiState.SlotLine.Running
    val state: SchoolUiState.LessonState = card.state
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5), modifier = modifier) {
        LessonBlock(card = card)
        if (state is SchoolUiState.LessonState.Open) {
            StudyAction(
                card = card,
                isLead = running == null,
                block = state.block,
                isWaiting = content.start == SchoolUiState.LessonRequest.Waiting,
                onIntent = onIntent,
            )
        }
        running?.let { slot: SchoolUiState.SlotLine.Running ->
            ReadWordsPill(running = slot, shown = card.lesson, onLessonOpen = onLessonOpen)
        }
        StartAnswer(lesson = card.lesson, start = content.start)
    }
}

@Composable
private fun LessonBlock(card: SchoolUiState.LessonCard, modifier: Modifier = Modifier) {
    MyGameBlock(
        hue = blockHueOf(card.number - 1),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameText(
            text = icuStringResource(R.string.school_lesson_title, "number" to card.number.toString()),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.onBlock,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(text = card.theme, style = MyGameTypography.reading, color = MyGameTheme.colors.onBlock)
        MyGameText(
            text = lessonSummaryOf(card),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.onBlockMuted,
        )
        if (card.state == SchoolUiState.LessonState.Studying) {
            MyGameText(
                text = stringResource(R.string.school_lesson_studying),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.onBlock,
            )
        }
    }
}

@Composable
private fun StudyAction(
    card: SchoolUiState.LessonCard,
    isLead: Boolean,
    block: SchoolUiState.LessonBlock?,
    isWaiting: Boolean,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = block?.let { blocked: SchoolUiState.LessonBlock -> blockLineOf(blocked) }
    val label: String = icuStringResource(
        R.string.school_study_with_duration,
        "action" to icuStringResource(R.string.school_lesson_study, "number" to card.number.toString()),
        "duration" to durationLabelOf(card.duration),
    )
    val busyDescription: String = stringResource(R.string.school_waiting)
    val onClick: () -> Unit = { onIntent(SchoolIntent.StudyTapped(card.lesson)) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        if (isLead) {
            MyGameButton(
                label = label,
                isBusy = isWaiting,
                busyDescription = busyDescription,
                onClick = onClick,
                blockedReason = reason,
            )
        } else {
            MyGameOutlinedButton(
                label = label,
                isBusy = isWaiting,
                busyDescription = busyDescription,
                onClick = onClick,
                blockedReason = reason,
            )
        }
        reason?.let { line: String ->
            MyGameText(
                text = line,
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.warningInk,
                modifier = Modifier.semantics {
                    hideFromAccessibility()
                    testTag = LESSON_BLOCK_LINE
                },
            )
        }
    }
}

@Composable
private fun ReadWordsPill(
    running: SchoolUiState.SlotLine.Running,
    shown: LessonId,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameButton(
        label = readWordsLabelOf(running.lesson, running.number, shown),
        isBusy = false,
        busyDescription = stringResource(R.string.school_waiting),
        onClick = { onLessonOpen(running.lesson) },
        modifier = modifier,
    )
}

@Composable
private fun blockLineOf(block: SchoolUiState.LessonBlock): String = when (block) {
    is SchoolUiState.LessonBlock.SlotBusy ->
        icuStringResource(R.string.school_lesson_slot_busy, "number" to block.number.toString())
    is SchoolUiState.LessonBlock.SchoolTooLow ->
        icuStringResource(R.string.school_lesson_needs_school, "level" to block.requiredLevel.toString())
    is SchoolUiState.LessonBlock.CapReached -> icuStringResource(
        R.string.school_lesson_cap_reached,
        "inLearning" to block.inLearning.toString(),
        "cap" to block.cap.toString(),
        "count" to block.wordCount.toString(),
    )
}

@Composable
private fun StartAnswer(
    lesson: LessonId,
    start: SchoolUiState.LessonRequest,
    modifier: Modifier = Modifier,
) {
    val asked: LessonId? = when (start) {
        is SchoolUiState.LessonRequest.Refused -> start.lesson
        is SchoolUiState.LessonRequest.Unreachable -> start.lesson
        SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Waiting -> null
    }
    if (asked != lesson) return
    requestAnswerOf(start)?.let { line: String -> MyGameInlineAlert(message = line, modifier = modifier) }
}
