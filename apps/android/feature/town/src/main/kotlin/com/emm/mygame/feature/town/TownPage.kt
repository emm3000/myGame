package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGamePlacePage
import com.emm.mygame.core.designsystem.MyGamePlaceWords
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.frameHeaderTurn
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TownPage(
    content: TownUiState.Content,
    place: TownUiState.PlaceCard,
    onIntent: (TownIntent) -> Unit,
    slots: TownPageSlots,
    foldedDock: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGamePlacePage(
        art = placeArtOf(place.kind, place.level),
        risenFrom = place.raisedFrom?.let { levelBefore: Int -> placeArtOf(place.kind, levelBefore) },
        isRiseSpoken = place.raisedFrom != null,
        name = copy.chrome(placeNameOf(place.kind)),
        level = copy.chrome { levelLineOf(place) },
        words = place.next?.wordsNeeded?.let { need: TownUiState.WordNeedLine -> copy.wordsOf(need) },
        header = { PageHeader(content = content, place = place, slots = slots, foldedDock = foldedDock) },
        work = { PageWork(content = content, place = place, onIntent = onIntent, slots = slots) },
        modifier = modifier,
    )
}

@Composable
private fun PageHeader(
    content: TownUiState.Content,
    place: TownUiState.PlaceCard,
    slots: TownPageSlots,
    foldedDock: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
        MyGameHeader(modifier = Modifier.frameHeaderTurn(), end = slots.ring) {
            Column {
                TownTitle(name = content.name, label = content.label)
                MyGameText(
                    label = chromeResource(
                        R.string.town_page_position,
                        "number" to (content.places.indexOf(place) + 1).toString(),
                        "count" to content.places.size.toString(),
                    ),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.inkMuted,
                )
            }
        }
        slots.status()
        foldedDock()
        content.season?.let { season: TownUiState.SeasonLine -> SeasonRow(season = season) }
        if (place.isInWork) content.buildMark?.let { mark: TownUiState.DurationMark -> BuildMarkRow(mark = mark) }
    }
}

@Composable
private fun PageWork(
    content: TownUiState.Content,
    place: TownUiState.PlaceCard,
    onIntent: (TownIntent) -> Unit,
    slots: TownPageSlots,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
        content.goal?.takeIf { goal: TownGoal -> goal.building == place.kind }?.let { goal: TownGoal ->
            GoalOnPage(goal = goal, onIntent = onIntent)
        }
        place.next?.let { next: TownUiState.NextLevelLine ->
            NextLevel(
                building = place.kind,
                next = next,
                block = place.block,
                isWaiting = content.start is TownUiState.StartStatus.Waiting,
                onIntent = onIntent,
            )
        }
        StartAnswer(building = place.kind, start = content.start)
        PlaceBuildingWork(place = place.kind, content = content, onIntent = onIntent)
        PlaceStocks(place = place.kind, content = content)
        PlaceOwnParts(place = place.kind, content = content, onIntent = onIntent, slots = slots)
        content.tip?.takeIf { shown: TipKind -> content.tipPlaceOf(shown) == place.kind }?.let { tip: TipKind ->
            TipNote(tip = tip, onIntent = onIntent)
        }
    }
}

@Composable
private fun PlaceOwnParts(
    place: TownBuildingKind,
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    slots: TownPageSlots,
) {
    when (place) {
        TownBuildingKind.School -> {
            MyGameTextLink(label = chromeResource(R.string.town_go_to_school), onClick = slots.onSchoolOpen)
            slots.placement()
        }
        TownBuildingKind.Office -> {
            OfficeSection(office = content.office, onIntent = onIntent)
            MyGameHairline()
            MyGameTextLink(label = chromeResource(R.string.town_map_link), onClick = slots.onMapOpen)
        }
        TownBuildingKind.Homes, TownBuildingKind.Farm, TownBuildingKind.Factory, TownBuildingKind.PowerStation,
        TownBuildingKind.Storage,
        -> Unit
    }
}

@Composable
private fun GoalOnPage(goal: TownGoal, onIntent: (TownIntent) -> Unit) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
        MyGameBlock(hue = MyGameBlockHue.Lavender) {
            GoalState(goal = goal)
        }
        MyGameTextButton(
            label = copy.chrome(R.string.town_goal_close),
            isBusy = false,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.GoalClosed) },
        )
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
private fun TownTitle(name: String, label: TownLabel, modifier: Modifier = Modifier) {
    MyGameText(
        label = rememberPlayerCopy().chrome {
            text(R.string.town_title, "name" to name, "label" to text(labelOf(label)))
        },
        style = MyGameTypography.title,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { heading() },
    )
}

private fun labelOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_label_town
    TownLabel.City -> R.string.town_label_city
}

private fun PlayerCopy.wordsOf(need: TownUiState.WordNeedLine): MyGamePlaceWords = MyGamePlaceWords(
    line = chrome(
        R.string.town_words_needed,
        "standing" to neededWordSelectorOf(need.standing),
        "needed" to need.needed.toString(),
        "held" to need.held.toString(),
    ),
    needed = need.needed,
    held = need.held,
)

internal fun CopyReader.levelLineOf(place: TownUiState.PlaceCard): String {
    if (place.next == null) return text(R.string.town_top_level)
    val inWork: String = text(R.string.town_in_work)
    if (place.level == 0) return if (place.isInWork) inWork else text(R.string.town_not_built)
    val level: String = text(R.string.town_level, "level" to place.level.toString())
    return if (place.isInWork) text(R.string.town_level_in_work, "level" to level, "inWork" to inWork) else level
}
