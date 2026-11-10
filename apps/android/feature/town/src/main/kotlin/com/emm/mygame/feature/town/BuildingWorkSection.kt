package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.ui.icuStringResource

internal const val WORK_DONE_ICON: String = "work_done_icon"

@Composable
internal fun BuildingWorkSection(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
                modifier = Modifier.padding(vertical = MyGameSpacing.step4),
            ) {
                WorkHeading()
                when (val slot: TownUiState.SlotLine = content.slot) {
                    TownUiState.SlotLine.Idle -> MyGameText(
                        text = stringResource(R.string.town_work_idle),
                        style = MyGameTypography.caption,
                        color = MyGameTheme.colors.inkMuted,
                    )
                    is TownUiState.SlotLine.Done -> DoneSlot(slot = slot)
                    is TownUiState.SlotLine.Busy -> BusySlot(slot = slot, stop = content.stop, onIntent = onIntent)
                }
            }
        }
        WaitingList(content = content, onIntent = onIntent)
    }
}

@Composable
private fun WorkHeading(modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.slot, tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            text = stringResource(R.string.town_work_title),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
private fun DoneSlot(slot: TownUiState.SlotLine.Done, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        WorkTitle(target = TownUiState.WorkTarget(slot.building, slot.level))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        ) {
            MyGameIcon(
                icon = MyGameIcons.check,
                tint = MyGameTheme.colors.ink,
                modifier = Modifier.testTag(WORK_DONE_ICON),
            )
            MyGameText(
                text = stringResource(R.string.town_work_done),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.ink,
            )
        }
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
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        WorkTitle(target = target)
        RunningCountdown(text = finishLabelOf(slot.remaining, slot.finishesAt))
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
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
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
}

@Composable
private fun WaitingItem(
    waiting: TownUiState.WaitingLine,
    stop: TownUiState.StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: TownUiState.WorkTarget = TownUiState.WorkTarget(waiting.building, waiting.level)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        FlowRow(
            horizontalArrangement = Arrangement.SpaceBetween,
            itemVerticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            ) {
                MyGameText(
                    text = stringResource(placeNameOf(target.building)),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.ink,
                )
                WorkLevel(level = target.level)
            }
            if (waiting.remaining.isPositive()) {
                RunningCountdown(text = finishLabelOf(waiting.remaining, waiting.finishesAt))
            } else {
                FinishedCountdown()
            }
        }
        StopControl(target = target, stop = stop, onIntent = onIntent)
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
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.weight(1f),
        )
        WorkLevel(level = target.level)
    }
}

@Composable
private fun WorkLevel(level: Int, modifier: Modifier = Modifier) {
    MyGameText(
        text = icuStringResource(R.string.town_level, "level" to level.toString()),
        style = MyGameTypography.caption.withTabularFigures(),
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier,
    )
}

@Composable
internal fun RunningCountdown(text: String, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            text = text,
            style = MyGameTypography.heading.withTabularFigures(),
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun FinishedCountdown(modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.ink)
        MyGameText(
            text = stringResource(R.string.town_work_ready),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
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
        MyGameOutlinedButton(
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
