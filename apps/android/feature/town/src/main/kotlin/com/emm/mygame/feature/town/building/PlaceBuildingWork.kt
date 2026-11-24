package com.emm.mygame.feature.town.building

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.finishLabelOf
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.FiguredCaption
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.RevealedAlert
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.placeNameOf
import com.emm.mygame.feature.town.townDurationCopy

internal const val WORK_DONE_ICON: String = "work_done_icon"

@Composable
internal fun PlaceBuildingWork(
    place: TownBuildingKind,
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val slot: SlotLine = content.slot
    val waiting: List<WaitingLine> =
        content.waitingList.filter { line: WaitingLine -> line.building == place }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        when (slot) {
            SlotLine.Idle -> Unit
            is SlotLine.Done -> if (slot.building == place) DoneSlot(slot = slot)
            is SlotLine.Busy ->
                if (slot.building == place) BusySlot(slot = slot, stop = content.stop, onIntent = onIntent)
        }
        if (waiting.isNotEmpty()) MyGameSectionTitle(label = chromeResource(R.string.town_work_waiting_list))
        waiting.forEach { line: WaitingLine ->
            WaitingItem(waiting = line, stop = content.stop, onIntent = onIntent)
        }
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
        MyGameSectionTitle(label = chromeResource(R.string.town_work_title))
    }
}

@Composable
private fun DoneSlot(slot: SlotLine.Done, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        WorkHeading()
        WorkTitle(target = WorkTarget(slot.building, slot.level))
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
                label = chromeResource(R.string.town_work_done),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.ink,
            )
        }
    }
}

@Composable
private fun BusySlot(
    slot: SlotLine.Busy,
    stop: StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: WorkTarget = WorkTarget(slot.building, slot.level)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        WorkHeading()
        WorkTitle(target = target)
        RunningCountdown(
            label = rememberPlayerCopy().chrome { finishLabelOf(slot.remaining, slot.finishesAt, townDurationCopy) },
        )
        MyGameTrack(
            filled = 1f - (slot.remaining / slot.total).toFloat(),
            color = MyGameTheme.colors.action,
        )
        StopControl(target = target, stop = stop, onIntent = onIntent)
    }
}

@Composable
private fun WaitingItem(
    waiting: WaitingLine,
    stop: StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: WorkTarget = WorkTarget(waiting.building, waiting.level)
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
                    label = chromeResource(placeNameOf(target.building)),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.ink,
                )
                WorkLevel(level = target.level)
            }
            if (waiting.remaining.isPositive()) {
                RunningCountdown(
                    label = rememberPlayerCopy().chrome {
                        finishLabelOf(waiting.remaining, waiting.finishesAt, townDurationCopy)
                    },
                )
            } else {
                FinishedCountdown()
            }
        }
        StopControl(target = target, stop = stop, onIntent = onIntent)
    }
}

@Composable
private fun WorkTitle(target: WorkTarget, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameText(
            label = chromeResource(placeNameOf(target.building)),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.weight(1f),
        )
        WorkLevel(level = target.level)
    }
}

@Composable
private fun WorkLevel(level: Int, modifier: Modifier = Modifier) {
    FiguredCaption(
        label = chromeResource(R.string.town_level, "level" to level.toString()),
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier,
    )
}

@Composable
internal fun RunningCountdown(label: MyGameLabel, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            label = label,
            style = MyGameTypography.title.withTabularFigures(),
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
            label = chromeResource(R.string.town_work_ready),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun StopControl(
    target: WorkTarget,
    stop: StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.town_work_refund),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameOutlinedButton(
            label = copy.chrome(R.string.town_work_stop),
            isBusy = stop is StopStatus.Waiting,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.StopTapped(target.building, target.level)) },
            accessibleName = copy.chrome {
                text(
                    R.string.town_work_stop_of,
                    "place" to text(placeNameOf(target.building)),
                    "level" to target.level.toString(),
                )
            }.spoken,
        )
        StopAnswer(target = target, stop = stop)
    }
}

@Composable
private fun StopAnswer(target: WorkTarget, stop: StopStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (stop) {
        is StopStatus.Refused ->
            if (stop.target == target) copy.fixedCopy { workRefusalLineOf(stop.refusal) } else null
        is StopStatus.Unreachable ->
            if (stop.target == target) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        StopStatus.Idle, is StopStatus.Waiting -> null
    }
    if (message != null) RevealedAlert(message = message, modifier = modifier)
}
