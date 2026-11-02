package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.RecruitRefusal
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.UnitKind

@Composable
internal fun ArmySection(army: FiefUiState.ArmyLine, onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    val isWaiting: Boolean = army.recruit == FiefUiState.RecruitStatus.Waiting
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.army_title))
        Card {
            when (val slot: FiefUiState.LevySlotLine = army.slot) {
                FiefUiState.LevySlotLine.Idle -> IdleLevy()
                is FiefUiState.LevySlotLine.Busy -> BusyLevy(slot = slot, isWaiting = isWaiting, onIntent = onIntent)
            }
        }
        army.units.forEach { card: FiefUiState.UnitCard ->
            UnitItem(card = card, isWaiting = isWaiting, onIntent = onIntent)
        }
        RecruitAnswer(recruit = army.recruit)
    }
}

@Composable
private fun IdleLevy(modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(R.string.levy_idle),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    )
}

@Composable
private fun BusyLevy(
    slot: FiefUiState.LevySlotLine.Busy,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val countdown: String = stringResource(R.string.levy_complete, countdownLabelOf(slot.remaining))
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        MyGameText(
            text = stringResource(R.string.levy_busy_title),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = stringResource(R.string.levy_order, slot.delivered, countedUnitsOf(slot.unit, slot.count)),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.clearAndSetSemantics { contentDescription = countdown },
        ) {
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.umber)
            MyGameText(text = countdown, style = MyGameTypography.action, color = MyGameTheme.colors.ink)
        }
        MyGameButton(
            label = stringResource(R.string.levy_cancel),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.RecruitCancelTapped(slot.unit, slot.startedAt)) },
            accessibleName = stringResource(R.string.levy_cancel_description, countedUnitsOf(slot.unit, slot.count)),
        )
        if (slot.refund.isNotEmpty()) {
            MyGameText(
                text = stringResource(
                    R.string.levy_refund,
                    countedUnitsOf(slot.unit, slot.undelivered),
                    refundOf(slot),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
    }
}

@Composable
private fun RecruitAnswer(recruit: FiefUiState.RecruitStatus, modifier: Modifier = Modifier) {
    val message: String? = when (recruit) {
        is FiefUiState.RecruitStatus.Refused -> refusalLineOf(recruit)
        FiefUiState.RecruitStatus.Unreachable -> stringResource(R.string.fief_unreachable)
        FiefUiState.RecruitStatus.Idle, FiefUiState.RecruitStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}

@Composable
private fun refusalLineOf(refused: FiefUiState.RecruitStatus.Refused): String = when (refused.refusal) {
    RecruitRefusal.BarracksTooLow -> stringResource(
        R.string.refusal_barracks_too_low,
        refused.barracksLevel,
        stringResource(unitPluralOf(refused.unit)),
    )
    RecruitRefusal.BarracksNotBuilt -> stringResource(R.string.refusal_barracks_not_built)
    RecruitRefusal.RecruitSlotBusy -> stringResource(R.string.refusal_recruit_slot_busy)
    RecruitRefusal.RecruitOrderNotFound -> stringResource(R.string.refusal_recruit_order_not_found)
    RecruitRefusal.InsufficientResources -> stringResource(R.string.refusal_insufficient_resources)
    RecruitRefusal.NotEnoughPeasants -> stringResource(R.string.refusal_not_enough_peasants)
    RecruitRefusal.Unrecognized -> stringResource(R.string.fief_unreachable)
}

@Composable
private fun refundOf(slot: FiefUiState.LevySlotLine.Busy): String = spanishListOf(
    items = slot.refund.map { cost: ResourceCost ->
        stringResource(costNameOf(cost.kind), formatQuantity(cost.amount))
    },
    pairPattern = stringResource(R.string.list_pair),
    morePattern = stringResource(R.string.list_more),
)

@Composable
internal fun countedUnitsOf(unit: UnitKind, count: Int): String =
    pluralStringResource(unitCountedOf(unit), count, count)

internal fun unitTitleOf(unit: UnitKind): Int = when (unit) {
    UnitKind.Infantry -> R.string.unit_infantry_title
    UnitKind.Cavalry -> R.string.unit_cavalry_title
    UnitKind.Archer -> R.string.unit_archer_title
    UnitKind.Settler -> R.string.unit_settler_title
}

internal fun unitPluralOf(unit: UnitKind): Int = when (unit) {
    UnitKind.Infantry -> R.string.unit_infantry_plural
    UnitKind.Cavalry -> R.string.unit_cavalry_plural
    UnitKind.Archer -> R.string.unit_archer_plural
    UnitKind.Settler -> R.string.unit_settler_plural
}

private fun unitCountedOf(unit: UnitKind): Int = when (unit) {
    UnitKind.Infantry -> R.plurals.unit_infantry_counted
    UnitKind.Cavalry -> R.plurals.unit_cavalry_counted
    UnitKind.Archer -> R.plurals.unit_archer_counted
    UnitKind.Settler -> R.plurals.unit_settler_counted
}
