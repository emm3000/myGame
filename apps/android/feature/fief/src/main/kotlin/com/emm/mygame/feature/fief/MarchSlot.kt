package com.emm.mygame.feature.fief

import android.content.res.Resources
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
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
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.projection.MarchPhase
import com.emm.mygame.core.ui.getIcuString
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun MarchSlot(
    march: FiefUiState.MarchSlotLine,
    recall: FiefUiState.RecallStatus,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        Card {
            when (march) {
                FiefUiState.MarchSlotLine.Idle -> MyGameText(
                    text = stringResource(R.string.march_idle),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.inkMuted,
                    modifier = Modifier.padding(vertical = MyGameSpacing.step4),
                )
                is FiefUiState.MarchSlotLine.Busy -> BusyMarch(march = march, recall = recall, onIntent = onIntent)
            }
        }
        RecallAnswer(recall = recall)
    }
}

@Composable
private fun BusyMarch(
    march: FiefUiState.MarchSlotLine.Busy,
    recall: FiefUiState.RecallStatus,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val party: String = partyPhraseOf(march)
    val countdown: String = icuStringResource(
        countdownOf(march.countdown),
        "countdown" to countdownLabelOf(march.remaining),
    )
    val detail: String? = march.detail?.let { shown: FiefUiState.MarchDetail -> detailOf(shown) }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        MyGameText(
            text = stringResource(R.string.march_busy_title),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = icuStringResource(
                R.string.march_line,
                "heading" to stringResource(headingOf(march.heading)),
                "value" to icuStringResource(
                    phaseValueOf(march.phase),
                    "party" to party,
                    "province" to march.target.province.toString(),
                    "plot" to march.target.plot.toString(),
                ),
            ),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        if (detail != null) {
            MyGameText(text = detail, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.clearAndSetSemantics { contentDescription = countdown },
        ) {
            MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.action)
            MyGameText(text = countdown, style = MyGameTypography.button, color = MyGameTheme.colors.ink)
        }
        if (march.loot.isNotEmpty()) {
            MyGameText(
                text = icuStringResource(R.string.march_loot, "loot" to lootOf(march)),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        if (march.isRecallable) {
            MyGameButton(
                label = stringResource(R.string.march_recall),
                isBusy = recall == FiefUiState.RecallStatus.Waiting,
                busyDescription = stringResource(R.string.building_waiting),
                onClick = { onIntent(FiefIntent.RecallTapped(march.departedAt)) },
                accessibleName = icuStringResource(R.string.march_recall_description, "party" to party),
            )
        }
    }
}

@Composable
private fun RecallAnswer(recall: FiefUiState.RecallStatus, modifier: Modifier = Modifier) {
    val message: String? = when (recall) {
        is FiefUiState.RecallStatus.Refused -> stringResource(recallRefusalOf(recall.refusal))
        FiefUiState.RecallStatus.Unreachable -> stringResource(R.string.fief_unreachable)
        FiefUiState.RecallStatus.Idle, FiefUiState.RecallStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}

@Composable
private fun partyPhraseOf(march: FiefUiState.MarchSlotLine.Busy): String = spanishListOf(
    items = march.units.map { count: UnitCount -> countedUnitsOf(count.unit, count.count) },
    pairPattern = stringResource(R.string.list_pair),
    morePattern = stringResource(R.string.list_more),
)

@Composable
private fun lootOf(march: FiefUiState.MarchSlotLine.Busy): String = LocalResources.current.quantitiesOf(march.loot)

private fun Resources.quantitiesOf(quantities: List<ResourceQuantity>): String = spanishListOf(
    items = quantities.map { quantity: ResourceQuantity ->
        getIcuString(costNameOf(quantity.kind), "amount" to formatQuantity(quantity.amount))
    },
    pairPattern = getString(R.string.list_pair),
    morePattern = getString(R.string.list_more),
)

@Composable
private fun detailOf(detail: FiefUiState.MarchDetail): String = when (detail) {
    is FiefUiState.MarchDetail.Camp -> icuStringResource(
        R.string.march_camp,
        "tier" to detail.camp.tier.toString(),
        "strength" to detail.camp.strength.toString(),
    )
    is FiefUiState.MarchDetail.NewFief -> icuStringResource(R.string.march_new_fief, "name" to detail.name)
    is FiefUiState.MarchDetail.Cargo ->
        icuStringResource(R.string.march_cargo, "cargo" to LocalResources.current.quantitiesOf(detail.cargo))
}

private fun countdownOf(countdown: FiefUiState.MarchCountdown): Int = when (countdown) {
    FiefUiState.MarchCountdown.Return -> R.string.march_return
    FiefUiState.MarchCountdown.Arrival -> R.string.march_arrival
}

private fun headingOf(heading: FiefUiState.MarchHeading): Int = when (heading) {
    FiefUiState.MarchHeading.Outbound -> R.string.march_heading_outbound
    FiefUiState.MarchHeading.Foraging -> R.string.march_heading_foraging
    FiefUiState.MarchHeading.Returning -> R.string.march_heading_returning
    FiefUiState.MarchHeading.AttackOutbound -> R.string.march_heading_attack
    FiefUiState.MarchHeading.AttackReturning -> R.string.march_heading_attack_returning
    FiefUiState.MarchHeading.FoundingOutbound -> R.string.march_heading_founding
    FiefUiState.MarchHeading.TransportOutbound -> R.string.march_heading_transport
    FiefUiState.MarchHeading.TransportReturning -> R.string.march_heading_transport_returning
}

private fun phaseValueOf(phase: MarchPhase): Int = when (phase) {
    MarchPhase.Outbound -> R.string.march_value_outbound
    MarchPhase.Foraging -> R.string.march_value_foraging
    MarchPhase.Returning -> R.string.march_value_returning
}

private fun recallRefusalOf(refusal: MarchRefusal): Int = when (refusal) {
    MarchRefusal.MarchNotFound -> R.string.refusal_march_not_found
    MarchRefusal.MarchAlreadyReturning -> R.string.refusal_march_already_returning
    is MarchRefusal.NotEnoughUnitsAtHome,
    MarchRefusal.MarchSlotBusy,
    is MarchRefusal.StayOutOfRange,
    MarchRefusal.MarchTargetOutOfBounds,
    MarchRefusal.PlotHeld,
    MarchRefusal.PlotHasCamp,
    MarchRefusal.PlotHasNoCamp,
    MarchRefusal.PlotReserved,
    MarchRefusal.MarchToOwnPlot,
    MarchRefusal.UnitUnfitForOrder,
    is MarchRefusal.FiefCapReached,
    MarchRefusal.BlankFiefName,
    MarchRefusal.EmptyCargo,
    is MarchRefusal.CargoAboveCarry,
    MarchRefusal.InsufficientResources,
    MarchRefusal.FiefNotFound,
    MarchRefusal.Unrecognized,
    -> R.string.fief_unreachable
}
