package com.emm.mygame.feature.school

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.control.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.control.MyGameOutlinedDoor
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameMetaText
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.englishTextOf
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

internal const val SHOWN_LESSON_CARD: String = "shown_lesson_card"

@Composable
internal fun ShownLesson(
    card: SchoolUiState.LessonCard,
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val running: SchoolUiState.SlotLine.Running? = content.slot as? SchoolUiState.SlotLine.Running
    val open: SchoolUiState.LessonState.Open? = card.state as? SchoolUiState.LessonState.Open
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4),
        modifier = modifier
            .fillMaxWidth()
            .testTag(SHOWN_LESSON_CARD)
            .background(MyGameTheme.colors.surfaceSunken, RoundedCornerShape(MyGameRadii.md))
            .padding(MyGameSpacing.step4),
    ) {
        LessonHeading(card = card, isStep = content.isStepLesson(card))
        if (open != null) {
            StudyAction(card = card, block = open.block, content = content, onIntent = onIntent)
        } else {
            LessonStartAnswer(lesson = card.lesson, start = content.start, opening = content.learning.opening)
        }
        running?.let { slot: SchoolUiState.SlotLine.Running ->
            ReadWordsButton(running = slot.lesson, name = slot.name, shown = card.lesson, onLessonOpen = onLessonOpen)
        }
    }
}

@Composable
private fun LessonHeading(card: SchoolUiState.LessonCard, isStep: Boolean, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        if (isStep) {
            MyGameMetaText(label = copy.chrome(R.string.school_next_title), color = MyGameTheme.colors.inkMuted)
        }
        MyGameText(
            label = copy.chrome(R.string.school_lesson_title, "number" to card.number.toString()),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(
            text = englishTextOf(card.theme),
            style = MyGameTypography.reading,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome { lessonSummaryOf(card) },
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.semantics { testTag = LESSON_SIZE_LABEL },
        )
        if (card.state == SchoolUiState.LessonState.Studying) StudyingLine()
    }
}

@Composable
private fun StudyingLine(modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameWorkingDots(tint = MyGameTheme.colors.ink)
        MyGameText(
            label = rememberPlayerCopy().chrome(R.string.school_lesson_studying),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun StudyAction(
    card: SchoolUiState.LessonCard,
    block: SchoolUiState.LessonBlock?,
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = block?.let { blocked: SchoolUiState.LessonBlock -> copy.blockLineOf(blocked) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameGoOutlinedButton(
            label = copy.studyLabelOf(card),
            isBusy = content.start == SchoolUiState.LessonRequestStatus.Waiting,
            busyDescription = copy.chrome(R.string.school_waiting),
            onClick = { onIntent(SchoolIntent.StudyTapped(card.lesson)) },
            blockedReason = reason,
        )
        LessonStartAnswer(lesson = card.lesson, start = content.start, opening = content.learning.opening)
    }
}

@Composable
private fun ReadWordsButton(
    running: LessonId,
    name: LessonName,
    shown: LessonId,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameOutlinedDoor(
        label = copy.readWordsLabelOf(running, name, shown),
        onClick = { onLessonOpen(running) },
        modifier = modifier,
    )
}
