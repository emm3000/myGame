package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
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
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(placesTitleOf(content.label)))
        content.places.forEach { place: TownUiState.PlaceCard ->
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
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
                modifier = Modifier.padding(vertical = MyGameSpacing.step3),
            ) {
                placeArtOf(place.kind, place.level)?.let { art: Int -> MyGamePlaceArt(art = art) }
                MyGameText(
                    text = stringResource(placeNameOf(place.kind)),
                    style = MyGameTypography.heading,
                    color = MyGameTheme.colors.ink,
                    modifier = Modifier.semantics { heading() },
                )
                MyGameText(
                    text = icuStringResource(R.string.town_level, "level" to place.level.toString()),
                    style = MyGameTypography.label,
                    color = MyGameTheme.colors.inkMuted,
                )
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
                if (place.kind == TownBuildingKind.School) {
                    MyGameTextLink(label = stringResource(R.string.town_go_to_school), onClick = onSchoolOpen)
                }
            }
        }
        StartAnswer(building = place.kind, start = start)
    }
}

@Composable
private fun AtTopLevel(modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.town_at_top_level),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = stringResource(R.string.town_top_level),
            style = MyGameTypography.button,
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
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            text = icuStringResource(R.string.town_people_at_work, "people" to next.people.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        Costs(next = next)
        MyGameButton(
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
                style = MyGameTypography.body,
                color = MyGameTheme.colors.miss,
                modifier = Modifier.clearAndSetSemantics { },
            )
        }
    }
}

@Composable
private fun Costs(next: TownUiState.NextLevelLine, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier,
    ) {
        next.costs.forEach { cost: TownUiState.CostLine -> CostItem(cost = cost) }
    }
}

@Composable
private fun CostItem(cost: TownUiState.CostLine, modifier: Modifier = Modifier) {
    val text: String = amountLineOf(cost.kind, cost.amount)
    val description: String = if (cost.isShort) text + stringResource(R.string.town_short_mark) else text
    MyGameText(
        text = text,
        style = MyGameTypography.body,
        color = if (cost.isShort) MyGameTheme.colors.miss else MyGameTheme.colors.ink,
        modifier = modifier.clearAndSetSemantics { contentDescription = description },
    )
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
private fun shortfallLineOf(block: TownUiState.BlockReason.Resources): String {
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
