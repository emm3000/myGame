package com.emm.mygame.feature.town.building.work

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.control.MyGameTrack
import com.emm.mygame.core.designsystem.text.MyGameSectionTitle
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.finishLabelOf
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
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
