package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.UpgradeRefusal
import kotlin.time.Duration

@Composable
internal fun BuildingsSection(
    content: FiefUiState.Content,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        SectionTitle(text = stringResource(R.string.buildings_title))
        content.buildings.forEach { card: FiefUiState.BuildingCard ->
            BuildingItem(card = card, upgrade = content.upgrade, onIntent = onIntent)
        }
    }
}

@Composable
private fun BuildingItem(
    card: FiefUiState.BuildingCard,
    upgrade: FiefUiState.UpgradeStatus,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        Card {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.padding(vertical = MyGameSpacing.step3),
            ) {
                MyGameText(
                    text = stringResource(buildingNameOf(card.kind)),
                    style = MyGameTypography.brand,
                    color = MyGameTheme.colors.ink,
                    modifier = Modifier.semantics { heading() },
                )
                MyGameText(
                    text = stringResource(R.string.building_level, card.level),
                    style = MyGameTypography.label,
                    color = MyGameTheme.colors.inkMuted,
                )
                when (val next: FiefUiState.NextLevelLine? = card.next) {
                    null -> AtMaxLevel()
                    else -> NextLevel(
                        building = card.kind,
                        next = next,
                        block = card.block,
                        isWaiting = upgrade is FiefUiState.UpgradeStatus.Waiting,
                        onIntent = onIntent,
                    )
                }
            }
        }
        UpgradeAnswer(building = card.kind, upgrade = upgrade)
    }
}

@Composable
private fun AtMaxLevel(modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.building_at_max_level),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = stringResource(R.string.building_max_level),
            style = MyGameTypography.action,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun NextLevel(
    building: BuildingKind,
    next: FiefUiState.NextLevelLine,
    block: FiefUiState.BlockReason?,
    isWaiting: Boolean,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val blocked: BlockedReason? = block?.let { blockReason: FiefUiState.BlockReason ->
        blockedReasonOf(reasonOf(blockReason), (blockReason as? FiefUiState.BlockReason.Resources)?.ready)
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.building_next_level, next.level),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        Costs(next = next)
        MyGameButton(
            label = stringResource(R.string.building_upgrade, durationLabelOf(next.duration)),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.UpgradeTapped(building)) },
            blockedReason = blocked?.description,
        )
        blocked?.let { line: BlockedReason -> BlockedReasonLine(blocked = line) }
    }
}

@Composable
private fun Costs(next: FiefUiState.NextLevelLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier,
    ) {
        next.costs.forEach { cost: FiefUiState.CostLine ->
            CostItem(text = stringResource(costNameOf(cost), formatQuantity(cost.amount)), isShort = cost.isShort)
        }
        if (next.peasants > 0) {
            CostItem(
                text = pluralStringResource(R.plurals.cost_peasants, next.peasants, next.peasants),
                isShort = next.isShortOfPeasants,
            )
        }
    }
}

@Composable
internal fun CostItem(text: String, isShort: Boolean, modifier: Modifier = Modifier) {
    val description: String = if (isShort) stringResource(R.string.cost_short, text) else text
    MyGameText(
        text = text,
        style = MyGameTypography.body,
        color = if (isShort) MyGameTheme.colors.rust else MyGameTheme.colors.ink,
        modifier = modifier.clearAndSetSemantics { contentDescription = description },
    )
}

@Composable
private fun UpgradeAnswer(building: BuildingKind, upgrade: FiefUiState.UpgradeStatus, modifier: Modifier = Modifier) {
    val message: String? = when (upgrade) {
        is FiefUiState.UpgradeStatus.Refused ->
            if (upgrade.building == building) stringResource(refusalOf(upgrade.refusal)) else null
        is FiefUiState.UpgradeStatus.Unreachable ->
            if (upgrade.building == building) stringResource(R.string.fief_unreachable) else null
        FiefUiState.UpgradeStatus.Idle, is FiefUiState.UpgradeStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}

@Composable
private fun reasonOf(block: FiefUiState.BlockReason): String = when (block) {
    FiefUiState.BlockReason.QueueFull -> stringResource(R.string.reason_queue_full)
    is FiefUiState.BlockReason.Peasants ->
        pluralStringResource(R.plurals.reason_peasants, block.needed, block.needed, block.free)
    is FiefUiState.BlockReason.Resources -> shortfallReasonOf(block)
}

@Composable
internal fun shortfallReasonOf(block: FiefUiState.BlockReason.Resources): String {
    val quantities: List<String> = block.shortfalls.map { shortfall: FiefUiState.Shortfall ->
        stringResource(costNameOf(shortfall.kind), formatQuantity(shortfall.amount))
    }
    val listed: String = spanishListOf(
        items = quantities,
        pairPattern = stringResource(R.string.list_pair),
        morePattern = stringResource(R.string.list_more),
    )
    val isSingleOne: Boolean = block.shortfalls.singleOrNull()?.amount == 1L
    return stringResource(if (isSingleOne) R.string.reason_resources_one else R.string.reason_resources, listed)
}

internal fun spanishListOf(items: List<String>, pairPattern: String, morePattern: String): String {
    if (items.size < 2) return items.joinToString()
    val head: String = items.dropLast(1).reduce { listed: String, item: String -> morePattern.format(listed, item) }
    return pairPattern.format(head, items.last())
}

@Composable
internal fun durationLabelOf(duration: Duration): String =
    duration.toComponents { hours: Long, minutes: Int, seconds: Int, _: Int ->
        when {
            hours == 0L -> stringResource(R.string.duration_minutes_seconds, minutes, seconds)
            minutes == 0 -> stringResource(R.string.duration_hours, hours)
            else -> stringResource(R.string.duration_hours_minutes, hours, minutes)
        }
    }

private fun costNameOf(cost: FiefUiState.CostLine): Int = costNameOf(cost.kind)

internal fun costNameOf(kind: ResourceKind): Int = when (kind) {
    ResourceKind.Wood -> R.string.cost_wood
    ResourceKind.Stone -> R.string.cost_stone
    ResourceKind.Iron -> R.string.cost_iron
    ResourceKind.Gold -> R.string.cost_gold
    ResourceKind.Food -> R.string.cost_food
}

private fun refusalOf(refusal: UpgradeRefusal): Int = when (refusal) {
    UpgradeRefusal.QueueFull -> R.string.refusal_queue_full
    UpgradeRefusal.InsufficientResources -> R.string.refusal_insufficient_resources
    UpgradeRefusal.NotEnoughPeasants -> R.string.refusal_not_enough_peasants
    UpgradeRefusal.MaxLevelReached -> R.string.refusal_max_level_reached
    UpgradeRefusal.Unrecognized -> R.string.fief_unreachable
}
