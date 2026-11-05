package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun BuildingWorkSection(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.town_work_title))
        MyGameCard {
            when (val slot: TownUiState.SlotLine = content.slot) {
                TownUiState.SlotLine.Idle -> SlotMessage(text = stringResource(R.string.town_work_idle))
                is TownUiState.SlotLine.Done -> DoneSlot(slot = slot)
                is TownUiState.SlotLine.Busy -> BusySlot(slot = slot, stop = content.stop, onIntent = onIntent)
            }
        }
        WaitingList(content = content, onIntent = onIntent)
    }
}

@Composable
private fun SlotMessage(text: String, modifier: Modifier = Modifier) {
    MyGameText(
        text = text,
        style = MyGameTypography.body,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    )
}

@Composable
private fun DoneSlot(slot: TownUiState.SlotLine.Done, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        WorkTitle(target = TownUiState.WorkTarget(slot.building, slot.level))
        MyGameText(
            text = stringResource(R.string.town_work_done),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.right,
        )
    }
}

@Composable
private fun BusySlot(
    slot: TownUiState.SlotLine.Busy,
    stop: TownUiState.StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: TownUiState.WorkTarget = TownUiState.WorkTarget(slot.building, slot.level)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        WorkTitle(target = target)
        Countdown(text = finishLabelOf(slot.remaining, slot.finishesAt))
        MyGameTrack(
            filled = 1f - (slot.remaining / slot.total).toFloat(),
            color = MyGameTheme.colors.action,
        )
        StopControl(target = target, stop = stop, onIntent = onIntent)
    }
}

@Composable
private fun WaitingList(content: TownUiState.Content, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    val last: TownUiState.WaitingLine = content.waitingList.lastOrNull() ?: return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(
            text = icuStringResource(
                R.string.town_work_waiting_list_summary,
                "title" to stringResource(R.string.town_work_waiting_list),
                "finish" to finishLabelOf(last.remaining, last.finishesAt),
            ),
        )
        content.waitingList.forEach { waiting: TownUiState.WaitingLine ->
            WaitingItem(waiting = waiting, stop = content.stop, onIntent = onIntent)
        }
    }
}

@Composable
private fun WaitingItem(
    waiting: TownUiState.WaitingLine,
    stop: TownUiState.StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: TownUiState.WorkTarget = TownUiState.WorkTarget(waiting.building, waiting.level)
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        ) {
            WorkTitle(target = target)
            Countdown(
                text = if (waiting.remaining.isPositive()) {
                    finishLabelOf(waiting.remaining, waiting.finishesAt)
                } else {
                    stringResource(R.string.town_work_ready)
                },
            )
            StopControl(target = target, stop = stop, onIntent = onIntent)
        }
    }
}

@Composable
private fun WorkTitle(target: TownUiState.WorkTarget, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameText(
            text = stringResource(placeNameOf(target.building)),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.weight(1f),
        )
        MyGameText(
            text = icuStringResource(R.string.town_level, "level" to target.level.toString()),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun Countdown(text: String, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
        MyGameText(text = text, style = MyGameTypography.numeral, color = MyGameTheme.colors.ink)
    }
}

@Composable
private fun StopControl(
    target: TownUiState.WorkTarget,
    stop: TownUiState.StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.town_work_refund),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameButton(
            label = stringResource(R.string.town_work_stop),
            isBusy = stop is TownUiState.StopStatus.Waiting,
            busyDescription = stringResource(R.string.town_waiting),
            onClick = { onIntent(TownIntent.StopTapped(target.building, target.level)) },
            accessibleName = icuStringResource(
                R.string.town_work_stop_of,
                "place" to stringResource(placeNameOf(target.building)),
                "level" to target.level.toString(),
            ),
        )
        StopAnswer(target = target, stop = stop)
    }
}

@Composable
private fun StopAnswer(target: TownUiState.WorkTarget, stop: TownUiState.StopStatus, modifier: Modifier = Modifier) {
    val message: String? = when (stop) {
        is TownUiState.StopStatus.Refused -> if (stop.target == target) workRefusalLineOf(stop.refusal) else null
        is TownUiState.StopStatus.Unreachable ->
            if (stop.target == target) stringResource(R.string.town_refusal_unexpected) else null
        TownUiState.StopStatus.Idle, is TownUiState.StopStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}
