package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.control.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.control.MyGameTrack
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.frame.MyGameCard
import com.emm.mygame.core.designsystem.text.MyGameSectionTitle
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.timeLeftLabelOf

internal const val LESSON_DONE_ICON: String = "lesson_done_icon"

@Composable
internal fun LessonSlotSection(
    slot: SchoolUiState.SlotLine,
    stop: SchoolUiState.LessonRequestStatus,
    opening: SchoolUiState.CapOpening,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val answer: String? = rememberPlayerCopy().requestAnswerOf(stop, opening)
    val running: SchoolUiState.SlotLine.Running? = slot as? SchoolUiState.SlotLine.Running
    if (running == null && answer == null) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        running?.let { lesson: SchoolUiState.SlotLine.Running ->
            RunningLesson(slot = lesson, stop = stop, onIntent = onIntent)
        }
        answer?.let { line: String -> MyGameInlineAlert(message = line) }
    }
}

@Composable
private fun RunningLesson(
    slot: SchoolUiState.SlotLine.Running,
    stop: SchoolUiState.LessonRequestStatus,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            SlotHeading()
            when (slot) {
                is SchoolUiState.SlotLine.Done -> DoneSlot(slot = slot)
                is SchoolUiState.SlotLine.Busy -> BusySlot(slot = slot, stop = stop, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun SlotHeading(modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.slot, tint = MyGameTheme.colors.inkMuted)
        MyGameSectionTitle(label = chromeResource(R.string.school_slot_title))
    }
}

@Composable
private fun LessonTitle(name: LessonName, modifier: Modifier = Modifier) {
    MyGameText(
        label = rememberPlayerCopy().lessonTitleOf(name),
        style = MyGameTypography.title,
        color = MyGameTheme.colors.ink,
        modifier = modifier,
    )
}

@Composable
private fun DoneSlot(slot: SchoolUiState.SlotLine.Done, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        LessonTitle(name = slot.name)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameIcon(
                icon = MyGameIcons.check,
                tint = MyGameTheme.colors.ink,
                modifier = Modifier.testTag(LESSON_DONE_ICON),
            )
            MyGameText(
                label = chromeResource(R.string.school_slot_done),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.ink,
            )
        }
    }
}

@Composable
private fun BusySlot(
    slot: SchoolUiState.SlotLine.Busy,
    stop: SchoolUiState.LessonRequestStatus,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        LessonTitle(name = slot.name)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameWorkingDots(tint = MyGameTheme.colors.inkMuted)
            MyGameText(
                label = copy.chrome { timeLeftLabelOf(slot.remaining, schoolDurationCopy) },
                style = MyGameTypography.heading.withTabularFigures(),
                color = MyGameTheme.colors.ink,
            )
        }
        val filled: Float = 1f - (slot.remaining / slot.total).toFloat()
        MyGameTrack(
            filled = filled,
            color = MyGameTheme.colors.action,
            modifier = Modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
        )
        MyGameText(
            label = copy.chrome(R.string.school_slot_refund),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameOutlinedButton(
            label = copy.chrome(R.string.school_slot_stop),
            isBusy = stop == SchoolUiState.LessonRequestStatus.Waiting,
            busyDescription = copy.chrome(R.string.school_waiting),
            onClick = { onIntent(SchoolIntent.StopTapped(slot.lesson)) },
            accessibleName = copy.slotStopNameOf(slot.name),
        )
    }
}
