package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun LessonSlotSection(
    slot: SchoolUiState.SlotLine,
    stop: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.school_slot_title))
        MyGameCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.padding(vertical = MyGameSpacing.step4),
            ) {
                when (slot) {
                    SchoolUiState.SlotLine.Idle -> MyGameText(
                        text = stringResource(R.string.school_slot_idle),
                        style = MyGameTypography.body,
                        color = MyGameTheme.colors.inkMuted,
                    )
                    is SchoolUiState.SlotLine.Done -> DoneSlot(slot = slot)
                    is SchoolUiState.SlotLine.Busy -> BusySlot(
                        slot = slot,
                        stop = stop,
                        onIntent = onIntent,
                        onLessonOpen = onLessonOpen,
                    )
                }
            }
        }
        requestAnswerOf(stop)?.let { line: String -> MyGameInlineAlert(message = line) }
    }
}

@Composable
private fun LessonTitle(number: Int, modifier: Modifier = Modifier) {
    MyGameText(
        text = icuStringResource(R.string.school_lesson_title, "number" to number.toString()),
        style = MyGameTypography.heading,
        color = MyGameTheme.colors.ink,
        modifier = modifier,
    )
}

@Composable
private fun DoneSlot(slot: SchoolUiState.SlotLine.Done, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        LessonTitle(number = slot.number)
        MyGameText(
            text = stringResource(R.string.school_slot_done),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun BusySlot(
    slot: SchoolUiState.SlotLine.Busy,
    stop: SchoolUiState.LessonRequest,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        LessonTitle(number = slot.number)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
            MyGameText(
                text = timeLeftLabelOf(slot.remaining),
                style = MyGameTypography.numeral,
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
            text = stringResource(R.string.school_slot_refund),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameTextLink(
            label = stringResource(R.string.school_lesson_read_words),
            onClick = { onLessonOpen(slot.lesson) },
        )
        MyGameButton(
            label = stringResource(R.string.school_slot_stop),
            isBusy = stop == SchoolUiState.LessonRequest.Waiting,
            busyDescription = stringResource(R.string.school_waiting),
            onClick = { onIntent(SchoolIntent.StopTapped(slot.lesson)) },
            accessibleName = icuStringResource(R.string.school_slot_stop_of, "number" to slot.number.toString()),
        )
    }
}
