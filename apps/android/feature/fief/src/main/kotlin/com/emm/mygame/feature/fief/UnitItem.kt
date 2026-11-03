package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity

@Composable
internal fun UnitItem(
    card: FiefUiState.UnitCard,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        ) {
            MyGameText(
                text = stringResource(unitTitleOf(card.kind)),
                style = MyGameTypography.brand,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            Tallies(card = card)
            when (card) {
                is FiefUiState.UnitCard.Locked -> LockedUnit(card = card)
                is FiefUiState.UnitCard.Open -> OpenUnit(card = card, isWaiting = isWaiting, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun Tallies(card: FiefUiState.UnitCard, modifier: Modifier = Modifier) {
    val atHome: String = countedUnitsOf(card.kind, card.atHome)
    val text: String = if (card.away == 0) {
        stringResource(R.string.units_at_home, atHome)
    } else {
        stringResource(R.string.units_at_home_and_away, atHome, countedUnitsOf(card.kind, card.away))
    }
    MyGameText(text = text, style = MyGameTypography.label, color = MyGameTheme.colors.inkMuted, modifier = modifier)
}

@Composable
private fun LockedUnit(card: FiefUiState.UnitCard.Locked, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.unit_requires, card.requiredLevel),
            style = MyGameTypography.action,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = stringResource(R.string.reason_barracks_too_low, card.requiredLevel, card.builtLevel),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.rust,
        )
    }
}

@Composable
private fun OpenUnit(
    card: FiefUiState.UnitCard.Open,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val blocked: BlockedReason? = card.block?.let { block: FiefUiState.RecruitBlock ->
        blockedReasonOf(reasonOf(block), (block as? FiefUiState.BlockReason.Resources)?.ready)
    }
    val plural: String = stringResource(unitPluralOf(card.kind))
    val action: String = when (val order: FiefUiState.RecruitLine? = card.order) {
        null -> stringResource(R.string.recruit_action, plural)
        else -> stringResource(R.string.recruit_action_with_duration, plural, durationLabelOf(order.duration))
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameTextField(
            value = card.entry,
            label = stringResource(R.string.recruit_field, stringResource(unitTitleOf(card.kind))),
            isSecret = false,
            isReadOnly = card.isEntryLocked,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
            onValueChange = { entry: String -> onIntent(FiefIntent.RecruitEntryChanged(card.kind, entry)) },
            keyboardActions = KeyboardActions(onDone = { onIntent(FiefIntent.RecruitTapped(card.kind)) }),
        )
        card.order?.let { order: FiefUiState.RecruitLine -> RecruitCosts(order = order) }
        MyGameButton(
            label = action,
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.RecruitTapped(card.kind)) },
            blockedReason = blocked?.description,
        )
        blocked?.let { line: BlockedReason -> BlockedReasonLine(blocked = line) }
    }
}

@Composable
private fun RecruitCosts(order: FiefUiState.RecruitLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier,
    ) {
        order.costs.forEach { cost: FiefUiState.CostLine ->
            CostItem(text = stringResource(costNameOf(cost.kind), formatQuantity(cost.amount)), isShort = cost.isShort)
        }
        if (order.peasants > 0) {
            CostItem(
                text = pluralStringResource(R.plurals.cost_peasants, order.peasants, order.peasants),
                isShort = order.isShortOfPeasants,
            )
        }
    }
}

@Composable
private fun reasonOf(block: FiefUiState.RecruitBlock): String = when (block) {
    FiefUiState.RecruitBlock.LevyRunning -> stringResource(R.string.reason_levy_running)
    FiefUiState.RecruitBlock.InvalidCount -> stringResource(R.string.reason_invalid_count)
    is FiefUiState.BlockReason.Peasants ->
        pluralStringResource(R.plurals.reason_peasants, block.needed, block.needed, block.free)
    is FiefUiState.BlockReason.Resources -> shortfallReasonOf(block)
}
