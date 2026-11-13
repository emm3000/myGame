package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

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
            ReadWordsPill(running = slot.lesson, name = slot.name, shown = card.lesson, onLessonOpen = onLessonOpen)
        }
        StartAnswer(lesson = card.lesson, start = content.start)
    }
}

@Composable
private fun LessonBlock(card: SchoolUiState.LessonCard, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameBlock(
        hue = blockHueOf(card.number - 1),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameText(
            label = copy.chrome(R.string.school_lesson_title, "number" to card.number.toString()),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.onBlock,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(text = card.theme, style = MyGameTypography.reading, color = MyGameTheme.colors.onBlock)
        MyGameText(
            label = copy.chrome { lessonSummaryOf(card) },
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.onBlockMuted,
        )
        if (card.state == SchoolUiState.LessonState.Studying) {
            MyGameText(
                label = copy.chrome(R.string.school_lesson_studying),
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
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = block?.let { blocked: SchoolUiState.LessonBlock -> copy.blockLineOf(blocked) }
    val label: MyGameLabel = copy.chrome {
        text(
            R.string.school_study_with_duration,
            "action" to text(R.string.school_lesson_study, "number" to card.number.toString()),
            "duration" to durationLabelOf(card.duration),
        )
    }
    val busyDescription: String = copy.chrome(R.string.school_waiting).spoken
    val onClick: () -> Unit = { onIntent(SchoolIntent.StudyTapped(card.lesson)) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        if (isLead) {
            MyGameButton(
                label = label,
                isBusy = isWaiting,
                busyDescription = busyDescription,
                onClick = onClick,
                blockedReason = reason?.spoken,
            )
        } else {
            MyGameOutlinedButton(
                label = label,
                isBusy = isWaiting,
                busyDescription = busyDescription,
                onClick = onClick,
                blockedReason = reason?.spoken,
            )
        }
        reason?.let { line: MyGameLabel -> BlockLine(line = line) }
    }
}

@Composable
private fun ReadWordsPill(
    running: LessonId,
    name: LessonName,
    shown: LessonId,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameButton(
        label = copy.readWordsLabelOf(running, name, shown),
        isBusy = false,
        busyDescription = copy.chrome(R.string.school_waiting).spoken,
        onClick = { onLessonOpen(running) },
        modifier = modifier,
    )
}

@Composable
internal fun StartAnswer(
    lesson: LessonId,
    start: SchoolUiState.LessonRequest,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val asked: LessonId? = when (start) {
        is SchoolUiState.LessonRequest.Refused -> start.lesson
        is SchoolUiState.LessonRequest.Unreachable -> start.lesson
        SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Waiting -> null
    }
    if (asked != lesson) return
    copy.requestAnswerOf(start)?.let { line: String -> MyGameInlineAlert(message = line, modifier = modifier) }
}
