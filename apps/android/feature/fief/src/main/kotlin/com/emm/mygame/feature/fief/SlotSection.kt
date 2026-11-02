package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.BuildingKind
import kotlin.time.Duration

@Composable
internal fun SlotSection(slot: FiefUiState.SlotLine, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.slot_title))
        Card {
            when (slot) {
                FiefUiState.SlotLine.Idle -> IdleSlot()
                is FiefUiState.SlotLine.Busy -> BusySlot(slot = slot)
            }
        }
    }
}

@Composable
private fun IdleSlot(modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(R.string.slot_idle),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    )
}

@Composable
private fun BusySlot(slot: FiefUiState.SlotLine.Busy, modifier: Modifier = Modifier) {
    val countdown: String = countdownLabelOf(slot.remaining)
    val description: String = stringResource(R.string.slot_countdown_description, countdown)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        MyGameText(
            text = stringResource(R.string.slot_busy_title),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = stringResource(buildingNameOf(slot.building)),
            style = MyGameTypography.brand,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = stringResource(R.string.slot_level, slot.targetLevel),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.clearAndSetSemantics { contentDescription = description },
        ) {
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.umber)
            MyGameText(text = countdown, style = MyGameTypography.action, color = MyGameTheme.colors.ink)
        }
    }
}

@Composable
private fun countdownLabelOf(remaining: Duration): String = remaining.toComponents { hours, minutes, seconds, _ ->
    when {
        hours > 0 -> stringResource(R.string.slot_countdown_hours, hours, minutes)
        minutes > 0 -> stringResource(R.string.slot_countdown_minutes, minutes)
        seconds > 0 -> stringResource(R.string.slot_countdown_seconds, seconds)
        else -> stringResource(R.string.slot_countdown_finished)
    }
}

private fun buildingNameOf(building: BuildingKind): Int = when (building) {
    BuildingKind.Sawmill -> R.string.building_sawmill
    BuildingKind.Quarry -> R.string.building_quarry
    BuildingKind.IronMine -> R.string.building_iron_mine
    BuildingKind.Farm -> R.string.building_farm
    BuildingKind.Warehouse -> R.string.building_warehouse
    BuildingKind.Library -> R.string.building_library
    BuildingKind.Barracks -> R.string.building_barracks
}
