package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.formatIcu
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun PlacesSection(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = stringResource(placesTitleOf(content.label)),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        content.places.forEachIndexed { index: Int, place: TownUiState.PlaceCard ->
            if (index > 0) MyGameHairline()
            PlaceItem(place = place, start = content.start, onIntent = onIntent, onSchoolOpen = onSchoolOpen)
        }
    }
}

@Composable
private fun PlaceItem(
    place: TownUiState.PlaceCard,
    start: TownUiState.StartStatus,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.padding(vertical = MyGameSpacing.step4),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
            MyGamePlaceArt(
                art = placeArtOf(place.kind, place.level),
                risenFrom = place.raisedFrom?.let { levelBefore: Int -> placeArtOf(place.kind, levelBefore) },
                modifier = Modifier.align(Alignment.CenterVertically),
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.weight(1f),
            ) {
                PlaceName(place = place)
                when (val next: TownUiState.NextLevelLine? = place.next) {
                    null -> AtTopLevel()
                    else -> NextLevel(
                        building = place.kind,
                        next = next,
                        block = place.block,
                        isWaiting = start is TownUiState.StartStatus.Waiting,
                        onIntent = onIntent,
                    )
                }
            }
        }
        StartAnswer(building = place.kind, start = start)
        if (place.kind == TownBuildingKind.School) {
            MyGameTextLink(label = stringResource(R.string.town_go_to_school), onClick = onSchoolOpen)
        }
    }
}

@Composable
private fun PlaceName(place: TownUiState.PlaceCard, modifier: Modifier = Modifier) {
    val spoken: Modifier = if (place.raisedFrom == null) {
        Modifier
    } else {
        Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite }
    }
    Column(modifier = modifier.then(spoken)) {
        MyGameText(
            text = stringResource(placeNameOf(place.kind)),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(
            text = levelLabelOf(place),
            style = MyGameTypography.caption.withTabularFigures(),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun levelLabelOf(place: TownUiState.PlaceCard): String {
    val inWork: String = stringResource(R.string.town_in_work)
    if (place.level == 0) return if (place.isInWork) inWork else stringResource(R.string.town_not_built)
    val level: String = icuStringResource(R.string.town_level, "level" to place.level.toString())
    return if (place.isInWork) {
        icuStringResource(R.string.town_level_in_work, "level" to level, "inWork" to inWork)
    } else {
        level
    }
}

@Composable
private fun AtTopLevel(modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.town_at_top_level),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = stringResource(R.string.town_top_level),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun NextLevel(
    building: TownBuildingKind,
    next: TownUiState.NextLevelLine,
    block: TownUiState.BlockReason?,
    isWaiting: Boolean,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val reason: String? = block?.let { blocked: TownUiState.BlockReason -> blockLineOf(blocked) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = icuStringResource(R.string.town_people_at_work, "people" to next.people.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        Costs(next = next)
        MyGameOutlinedButton(
            label = icuStringResource(
                R.string.town_build_with_duration,
                "action" to icuStringResource(R.string.town_build, "level" to next.level.toString()),
                "duration" to durationLabelOf(next.duration),
            ),
            isBusy = isWaiting,
            busyDescription = stringResource(R.string.town_waiting),
            onClick = { onIntent(TownIntent.BuildTapped(building)) },
            blockedReason = reason,
        )
        reason?.let { line: String ->
            MyGameText(
                text = line,
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.warningInk,
                modifier = Modifier.semantics { hideFromAccessibility() },
            )
        }
    }
}

@Composable
private fun Costs(next: TownUiState.NextLevelLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        next.costs.forEach { cost: TownUiState.CostLine -> CostItem(cost = cost) }
    }
}

@Composable
internal fun CostItem(cost: TownUiState.CostLine, modifier: Modifier = Modifier) {
    val spoken: String = amountLineOf(cost.kind, cost.amount)
    val description: String = if (cost.isShort) spoken + stringResource(R.string.town_short_mark) else spoken
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.clearAndSetSemantics { contentDescription = description },
    ) {
        MyGameIcon(
            icon = resourceIconOf(cost.kind),
            tint = MyGameTheme.colors.ink,
            modifier = Modifier.size(MyGameSizes.iconSmall),
        )
        MyGameText(
            text = formatQuantity(cost.amount),
            style = MyGameTypography.caption.withTabularFigures(),
            color = if (cost.isShort) MyGameTheme.colors.warningInk else MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun StartAnswer(building: TownBuildingKind, start: TownUiState.StartStatus, modifier: Modifier = Modifier) {
    val message: String? = when (start) {
        is TownUiState.StartStatus.Refused -> if (start.building == building) workRefusalLineOf(start.refusal) else null
        is TownUiState.StartStatus.Unreachable ->
            if (start.building == building) stringResource(R.string.town_refusal_unexpected) else null
        TownUiState.StartStatus.Idle, is TownUiState.StartStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}

@Composable
private fun blockLineOf(block: TownUiState.BlockReason): String = when (block) {
    is TownUiState.BlockReason.WaitingListFull ->
        icuStringResource(R.string.town_refusal_waiting_list_full, "cap" to block.cap)
    is TownUiState.BlockReason.PeopleShort ->
        icuStringResource(R.string.town_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is TownUiState.BlockReason.Resources -> shortfallLineOf(block)
}

@Composable
internal fun shortfallLineOf(block: TownUiState.BlockReason.Resources): String {
    val amounts: List<String> = block.shortfalls.map { shortfall: TownUiState.Shortfall ->
        amountLineOf(shortfall.kind, shortfall.amount)
    }
    return icuStringResource(
        R.string.town_shortfall,
        "missing" to joinedOf(
            items = amounts,
            pairPattern = stringResource(R.string.town_list_pair),
            morePattern = stringResource(R.string.town_list_more),
        ),
    )
}

@Composable
private fun amountLineOf(kind: TownResourceKind, amount: Long): String = icuStringResource(
    R.string.town_amount,
    "amount" to formatQuantity(amount),
    "resource" to stringResource(resourceNameOf(kind)),
)

private fun joinedOf(items: List<String>, pairPattern: String, morePattern: String): String {
    if (items.size < 2) return items.joinToString()
    val head: String = items.dropLast(1).reduce { listed: String, item: String ->
        morePattern.formatIcu("listed" to listed, "item" to item)
    }
    return pairPattern.formatIcu("listed" to head, "last" to items.last())
}

private fun placesTitleOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_places_title_town
    TownLabel.City -> R.string.town_places_title_city
}
