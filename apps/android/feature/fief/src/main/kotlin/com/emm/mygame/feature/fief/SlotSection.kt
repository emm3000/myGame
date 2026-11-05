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
import com.emm.mygame.core.ui.icuStringResource
import kotlin.time.Duration

@Composable
internal fun SlotSection(content: FiefUiState.Content, onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.slot_title))
        Card {
            when (val slot: FiefUiState.SlotLine = content.slot) {
                FiefUiState.SlotLine.Idle -> IdleSlot()
                is FiefUiState.SlotLine.Busy -> BusySlot(
                    slot = slot,
                    waitingSummary = waitingSummaryOf(content),
                    cancel = content.cancel,
                    onIntent = onIntent,
                )
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
private fun BusySlot(
    slot: FiefUiState.SlotLine.Busy,
    waitingSummary: String?,
    cancel: FiefUiState.CancelStatus,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val countdown: String = countdownLabelOf(slot.remaining)
    val description: String = icuStringResource(R.string.slot_countdown_description, "countdown" to countdown)
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
            text = icuStringResource(R.string.slot_level, "level" to slot.targetLevel.toString()),
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
        if (waitingSummary != null) {
            MyGameText(text = waitingSummary, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        }
        CancelControl(
            target = FiefUiState.UpgradeTarget(slot.building, slot.targetLevel),
            cancel = cancel,
            onIntent = onIntent,
        )
    }
}

@Composable
internal fun countdownLabelOf(remaining: Duration): String = remaining.toComponents { hours, minutes, seconds, _ ->
    when {
        hours > 0 -> icuStringResource(
            R.string.slot_countdown_hours,
            "hours" to hours.toString(),
            "minutes" to minutes.toString(),
        )
        minutes > 0 -> icuStringResource(R.string.slot_countdown_minutes, "minutes" to minutes.toString())
        seconds > 0 -> icuStringResource(R.string.slot_countdown_seconds, "seconds" to seconds.toString())
        else -> stringResource(R.string.slot_countdown_finished)
    }
}

internal fun buildingNameOf(building: BuildingKind): Int = when (building) {
    BuildingKind.Sawmill -> R.string.building_sawmill
    BuildingKind.Quarry -> R.string.building_quarry
    BuildingKind.IronMine -> R.string.building_iron_mine
    BuildingKind.Farm -> R.string.building_farm
    BuildingKind.Warehouse -> R.string.building_warehouse
    BuildingKind.Library -> R.string.building_library
    BuildingKind.Barracks -> R.string.building_barracks
}
