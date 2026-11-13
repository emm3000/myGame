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
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy

internal const val LESSON_DONE_ICON: String = "lesson_done_icon"

@Composable
internal fun LessonSlotSection(
    slot: SchoolUiState.SlotLine,
    stop: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
                modifier = Modifier.padding(vertical = MyGameSpacing.step4),
            ) {
                SlotHeading()
                when (slot) {
                    SchoolUiState.SlotLine.Idle -> MyGameText(
                        label = copy.chrome(R.string.school_slot_idle),
                        style = MyGameTypography.caption,
                        color = MyGameTheme.colors.inkMuted,
                    )
                    is SchoolUiState.SlotLine.Done -> DoneSlot(slot = slot)
                    is SchoolUiState.SlotLine.Busy -> BusySlot(slot = slot, stop = stop, onIntent = onIntent)
                }
            }
        }
        copy.requestAnswerOf(stop)?.let { line: String -> MyGameInlineAlert(message = line) }
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
        MyGameText(
            label = chromeResource(R.string.school_slot_title),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
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
    stop: SchoolUiState.LessonRequest,
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
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
            MyGameText(
                label = copy.chrome { timeLeftLabelOf(slot.remaining) },
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
            isBusy = stop == SchoolUiState.LessonRequest.Waiting,
            busyDescription = copy.chrome(R.string.school_waiting).spoken,
            onClick = { onIntent(SchoolIntent.StopTapped(slot.lesson)) },
            accessibleName = copy.slotStopNameOf(slot.name),
        )
    }
}
