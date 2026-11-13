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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@Composable
internal fun PlacesSection(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = chromeResource(placesTitleOf(content.label)),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        content.buildMark?.let { mark: TownUiState.DurationMark -> BuildMarkRow(mark = mark) }
        content.places.forEachIndexed { index: Int, place: TownUiState.PlaceCard ->
            if (index > 0) MyGameHairline()
            PlaceItem(place = place, start = content.start, onIntent = onIntent, onSchoolOpen = onSchoolOpen)
        }
    }
}

@Composable
private fun BuildMarkRow(mark: TownUiState.DurationMark, modifier: Modifier = Modifier) {
    SeasonMark(
        icon = seasonIconOf(mark.season),
        label = chromeResource(
            R.string.town_season_build_mark,
            "season" to seasonSelectorOf(mark.season),
            "percent" to mark.percent.toString(),
        ),
        modifier = modifier,
    )
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
            MyGameTextLink(label = chromeResource(R.string.town_go_to_school), onClick = onSchoolOpen)
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
            label = chromeResource(placeNameOf(place.kind)),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(
            label = rememberPlayerCopy().chrome { levelLabelOf(place) },
            style = MyGameTypography.caption.withTabularFigures(),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

private fun CopyReader.levelLabelOf(place: TownUiState.PlaceCard): String {
    val inWork: String = text(R.string.town_in_work)
    if (place.level == 0) return if (place.isInWork) inWork else text(R.string.town_not_built)
    val level: String = text(R.string.town_level, "level" to place.level.toString())
    return if (place.isInWork) text(R.string.town_level_in_work, "level" to level, "inWork" to inWork) else level
}

@Composable
private fun AtTopLevel(modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.town_at_top_level),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            label = chromeResource(R.string.town_top_level),
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
    val copy: PlayerCopy = rememberPlayerCopy()
    val reason: MyGameLabel? = block?.let { blocked: TownUiState.BlockReason -> copy.blockLineOf(blocked) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.town_people_at_work, "people" to next.people.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        Costs(next = next)
        MyGameOutlinedButton(
            label = copy.chrome {
                text(
                    R.string.town_build_with_duration,
                    "action" to text(R.string.town_build, "level" to next.level.toString()),
                    "duration" to durationLabelOf(next.duration),
                )
            },
            isBusy = isWaiting,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.BuildTapped(building)) },
            blockedReason = reason?.spoken,
        )
        reason?.let { line: MyGameLabel ->
            MyGameText(
                label = line,
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.warningInk,
                modifier = Modifier.semantics { hideFromAccessibility() },
            )
        }
        (block as? TownUiState.BlockReason.Resources)?.ready?.let { ready: TownUiState.ReadyTime ->
            ReadyLine(ready = ready)
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
    val description: String = rememberPlayerCopy().chrome {
        shortMarked(amountLineOf(cost.kind, cost.amount), cost.isShort)
    }.spoken
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
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (start) {
        is TownUiState.StartStatus.Refused ->
            if (start.building == building) copy.fixedCopy { workRefusalLineOf(start.refusal) } else null
        is TownUiState.StartStatus.Unreachable ->
            if (start.building == building) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        TownUiState.StartStatus.Idle, is TownUiState.StartStatus.Waiting -> null
    }
    if (message != null) MyGameInlineAlert(message = message, modifier = modifier)
}

private fun PlayerCopy.blockLineOf(block: TownUiState.BlockReason): MyGameLabel = when (block) {
    is TownUiState.BlockReason.WaitingListFull -> MyGameLabel(
        text = fixedCopy(R.string.town_refusal_waiting_list_full, "cap" to block.cap),
        translation = null,
    )
    is TownUiState.BlockReason.PeopleShort ->
        chrome(R.string.town_people_short, "needed" to block.needed.toString(), "free" to block.free)
    is TownUiState.BlockReason.Resources -> chrome { shortfallLineOf(block) }
}

internal fun CopyReader.shortfallLineOf(block: TownUiState.BlockReason.Resources): String {
    val amounts: List<String> = block.shortfalls.map { shortfall: TownUiState.Shortfall ->
        amountLineOf(shortfall.kind, shortfall.amount)
    }
    return text(R.string.town_shortfall, "missing" to joinedOf(amounts))
}

private fun CopyReader.amountLineOf(kind: TownResourceKind, amount: Long): String = text(
    R.string.town_amount,
    "amount" to formatQuantity(amount),
    "resource" to text(resourceNameOf(kind)),
)

private fun CopyReader.joinedOf(items: List<String>): String {
    if (items.size < 2) return items.joinToString()
    val head: String = items.dropLast(1).reduce { listed: String, item: String ->
        text(R.string.town_list_more, "listed" to listed, "item" to item)
    }
    return text(R.string.town_list_pair, "listed" to head, "last" to items.last())
}

private fun placesTitleOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_places_title_town
    TownLabel.City -> R.string.town_places_title_city
}

private val previewNextLevel: TownUiState.NextLevelLine = TownUiState.NextLevelLine(
    level = 2,
    costs = listOf(TownUiState.CostLine(TownResourceKind.Food, amount = 120, isShort = true)),
    duration = 3.minutes,
    people = 2,
)

private fun shortOfFoodUntil(ready: TownUiState.ReadyTime): TownUiState.BlockReason =
    TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Food, amount = 40)), ready = ready)

private class ReadyLineStates : PreviewParameterProvider<TownUiState.BlockReason> {

    override val values: Sequence<TownUiState.BlockReason> = sequenceOf(
        shortOfFoodUntil(TownUiState.ReadyTime(24.minutes, Instant.parse("2026-11-12T15:24:00Z"))),
        shortOfFoodUntil(TownUiState.ReadyTime(2.hours, Instant.parse("2026-11-12T13:00:00Z"))),
        shortOfFoodUntil(TownUiState.ReadyTime(23.hours, Instant.parse("2026-11-13T11:00:00Z"))),
        TownUiState.BlockReason.PeopleShort(needed = 2, free = 0),
    )
}

@PreviewMyGame
@Composable
private fun NextLevelReadyPreview(@PreviewParameter(ReadyLineStates::class) block: TownUiState.BlockReason) {
    MyGamePreviewSurface {
        NextLevel(
            building = TownBuildingKind.Farm,
            next = previewNextLevel,
            block = block,
            isWaiting = false,
            onIntent = {},
        )
    }
}
