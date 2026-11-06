package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusManager
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun UnitItem(
    card: FiefUiState.UnitCard,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        ) {
            MyGameText(
                text = stringResource(unitTitleOf(card.kind)),
                style = MyGameTypography.title,
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
        icuStringResource(R.string.units_at_home, "units" to atHome)
    } else {
        icuStringResource(
            R.string.units_at_home_and_away,
            "atHome" to atHome,
            "away" to countedUnitsOf(card.kind, card.away),
        )
    }
    MyGameText(text = text, style = MyGameTypography.label, color = MyGameTheme.colors.inkMuted, modifier = modifier)
}

@Composable
private fun LockedUnit(card: FiefUiState.UnitCard.Locked, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = icuStringResource(R.string.unit_requires, "level" to card.requiredLevel.toString()),
            style = MyGameTypography.button,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = icuStringResource(
                R.string.reason_barracks_too_low,
                "required" to card.requiredLevel.toString(),
                "built" to card.builtLevel.toString(),
            ),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.destructiveInk,
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
        null -> icuStringResource(R.string.recruit_action, "units" to plural)
        else -> icuStringResource(
            R.string.recruit_action_with_duration,
            "units" to plural,
            "duration" to durationLabelOf(order.duration),
        )
    }
    val focusManager: FocusManager = LocalFocusManager.current
    val send: () -> Unit = {
        focusManager.clearFocus()
        onIntent(FiefIntent.RecruitTapped(card.kind))
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameTextField(
            value = card.entry,
            label = icuStringResource(R.string.recruit_field, "unit" to stringResource(unitTitleOf(card.kind))),
            isSecret = false,
            isReadOnly = card.isEntryLocked,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
            onValueChange = { entry: String -> onIntent(FiefIntent.RecruitEntryChanged(card.kind, entry)) },
            keyboardActions = KeyboardActions(onDone = { send() }),
        )
        card.order?.let { order: FiefUiState.RecruitLine -> RecruitCosts(order = order) }
        MyGameOutlinedButton(
            label = action,
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = send,
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
            CostItem(
                text = icuStringResource(costNameOf(cost.kind), "amount" to formatQuantity(cost.amount)),
                isShort = cost.isShort,
            )
        }
        if (order.peasants > 0) {
            CostItem(
                text = icuStringResource(R.string.cost_peasants, "count" to order.peasants),
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
        icuStringResource(R.string.reason_peasants, "needed" to block.needed, "free" to block.free.toString())
    is FiefUiState.BlockReason.Resources -> shortfallReasonOf(block)
}
