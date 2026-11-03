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
    val countdown: String = stringResource(R.string.march_return, countdownLabelOf(march.remaining))
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
            text = stringResource(phaseLineOf(march.phase), party, march.target.province, march.target.plot),
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
        if (march.loot.isNotEmpty()) {
            MyGameText(
                text = stringResource(R.string.march_loot, lootOf(march)),
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
                accessibleName = stringResource(R.string.march_recall_description, party),
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
private fun lootOf(march: FiefUiState.MarchSlotLine.Busy): String = spanishListOf(
    items = march.loot.map { quantity: ResourceQuantity ->
        stringResource(costNameOf(quantity.kind), formatQuantity(quantity.amount))
    },
    pairPattern = stringResource(R.string.list_pair),
    morePattern = stringResource(R.string.list_more),
)

private fun phaseLineOf(phase: MarchPhase): Int = when (phase) {
    MarchPhase.Outbound -> R.string.march_line_outbound
    MarchPhase.Foraging -> R.string.march_line_foraging
    MarchPhase.Returning -> R.string.march_line_returning
}

private fun recallRefusalOf(refusal: MarchRefusal): Int = when (refusal) {
    MarchRefusal.MarchNotFound -> R.string.refusal_march_not_found
    MarchRefusal.MarchAlreadyReturning -> R.string.refusal_march_already_returning
    MarchRefusal.NotEnoughUnitsAtHome,
    MarchRefusal.MarchSlotBusy,
    MarchRefusal.StayOutOfRange,
    MarchRefusal.MarchTargetOutOfBounds,
    MarchRefusal.PlotHeld,
    MarchRefusal.PlotHasCamp,
    MarchRefusal.PlotReserved,
    MarchRefusal.UnitUnfitForOrder,
    MarchRefusal.Unrecognized,
    -> R.string.fief_unreachable
}
