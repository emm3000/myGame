package com.emm.mygame.feature.school

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.ui.icuStringResource

internal const val LESSON_BLOCK_LINE: String = "lesson_block_line"

@Composable
internal fun LessonsSection(
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.school_lessons))
        content.lessons.forEach { card: SchoolUiState.LessonCard ->
            LessonItem(card = card, start = content.start, onIntent = onIntent)
        }
    }
}

@Composable
private fun LessonItem(
    card: SchoolUiState.LessonCard,
    start: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.padding(vertical = MyGameSpacing.step3),
            ) {
                MyGameText(
                    text = icuStringResource(R.string.school_lesson_title, "number" to card.number.toString()),
                    style = MyGameTypography.heading,
                    color = MyGameTheme.colors.ink,
                    modifier = Modifier.semantics { heading() },
                )
                MyGameText(text = card.theme, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
                MyGameText(
                    text = summaryOf(card),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.inkMuted,
                )
                when (val state: SchoolUiState.LessonState = card.state) {
                    SchoolUiState.LessonState.Studied -> LessonStatus(label = R.string.school_lesson_studied)
                    SchoolUiState.LessonState.Studying -> LessonStatus(label = R.string.school_lesson_studying)
                    is SchoolUiState.LessonState.Open -> StudyAction(
                        card = card,
                        block = state.block,
                        isWaiting = start == SchoolUiState.LessonRequest.Waiting,
                        onIntent = onIntent,
                    )
                }
            }
        }
        StartAnswer(lesson = card.lesson, start = start)
    }
}

@Composable
private fun summaryOf(card: SchoolUiState.LessonCard): String = icuStringResource(
    R.string.school_lesson_summary,
    "words" to icuStringResource(R.string.school_lesson_words, "count" to card.wordCount),
    "skill" to icuStringResource(
        R.string.school_skill_rate,
        "percent" to card.ratePercent.toString(),
        "resource" to stringResource(resourceNameOf(card.resource)),
    ),
)

@Composable
private fun LessonStatus(@StringRes label: Int, modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(label),
        style = MyGameTypography.label,
        color = MyGameTheme.colors.ink,
        modifier = modifier
            .background(MyGameTheme.colors.surfaceSunken, RoundedCornerShape(MyGameRadii.pill))
            .padding(horizontal = MyGameSpacing.step2),
    )
}

@Composable
private fun StudyAction(
    card: SchoolUiState.LessonCard,
    block: SchoolUiState.LessonBlock?,
    isWaiting: Boolean,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = block?.let { blocked: SchoolUiState.LessonBlock -> blockLineOf(blocked) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameButton(
            label = icuStringResource(
                R.string.school_study_with_duration,
                "action" to icuStringResource(R.string.school_lesson_study, "number" to card.number.toString()),
                "duration" to durationLabelOf(card.duration),
            ),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.school_waiting),
            onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
            blockedReason = reason,
        )
        reason?.let { line: String ->
            MyGameText(
                text = line,
                style = MyGameTypography.body,
                color = MyGameTheme.colors.miss,
                modifier = Modifier.clearAndSetSemantics { testTag = LESSON_BLOCK_LINE },
            )
        }
    }
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
private fun StartAnswer(lesson: LessonId, start: SchoolUiState.LessonRequest, modifier: Modifier = Modifier) {
    val asked: LessonId? = when (start) {
        is SchoolUiState.LessonRequest.Refused -> start.lesson
        is SchoolUiState.LessonRequest.Unreachable -> start.lesson
        SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Waiting -> null
    }
    if (asked != lesson) return
    requestAnswerOf(start)?.let { line: String -> MyGameInlineAlert(message = line, modifier = modifier) }
}
