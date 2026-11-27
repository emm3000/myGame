package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.art.MyGamePlacePage
import com.emm.mygame.core.designsystem.art.MyGamePlaceWords
import com.emm.mygame.core.designsystem.control.MyGameOutlinedDoor
import com.emm.mygame.core.designsystem.control.MyGameTextLink
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.WordNeedLine
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.DurationMark
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.SeasonMark
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.seasonIconOf
import com.emm.mygame.core.ui.seasonSelectorOf
import com.emm.mygame.feature.town.building.NextLevel
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.PlaceStocks
import com.emm.mygame.feature.town.building.placeArtOf
import com.emm.mygame.feature.town.building.work.PlaceBuildingWork
import com.emm.mygame.feature.town.guidance.GoalState
import com.emm.mygame.feature.town.guidance.TipNote
import com.emm.mygame.feature.town.guidance.tipPlaceOf
import com.emm.mygame.feature.town.hiring.HiringSection

@Composable
internal fun TownPage(
    content: TownUiState.Content,
    place: PlaceCard,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onMapOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGamePlacePage(
        art = placeArtOf(place.kind, place.level),
        risenFrom = place.raisedFrom?.let { levelBefore: Int -> placeArtOf(place.kind, levelBefore) },
        isRiseSpoken = place.raisedFrom != null,
        name = copy.chrome(placeNameOf(place.kind)),
        level = copy.chrome { levelLineOf(place) },
        words = place.next?.wordsNeeded?.let { need: WordNeedLine -> copy.wordsOf(need) },
        header = {
            if (place.isInWork) content.buildMark?.let { mark: DurationMark -> BuildMarkRow(mark = mark) }
        },
        work = {
            PageWork(
                content = content,
                place = place,
                onIntent = onIntent,
                onSchoolOpen = onSchoolOpen,
                onMapOpen = onMapOpen,
            )
        },
        modifier = modifier,
    )
}

@Composable
private fun PageWork(
    content: TownUiState.Content,
    place: PlaceCard,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onMapOpen: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
        content.goal?.takeIf { goal: TownGoal -> goal.building == place.kind }?.let { goal: TownGoal ->
            GoalOnPage(goal = goal, onIntent = onIntent)
        }
        place.next?.let { next: NextLevelLine ->
            NextLevel(
                building = place.kind,
                next = next,
                block = place.block,
                start = content.start,
                onIntent = onIntent,
            )
        }
        PlaceBuildingWork(place = place.kind, content = content, onIntent = onIntent)
        PlaceStocks(place = place.kind, content = content)
        PlaceOwnParts(
            place = place.kind,
            content = content,
            onIntent = onIntent,
            onSchoolOpen = onSchoolOpen,
            onMapOpen = onMapOpen,
        )
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
    onSchoolOpen: () -> Unit,
    onMapOpen: () -> Unit,
) {
    when (place) {
        TownBuildingKind.School -> {
            MyGameOutlinedDoor(label = chromeResource(R.string.town_go_to_lessons), onClick = onSchoolOpen)
        }
        TownBuildingKind.Office -> {
            HiringSection(hiring = content.hiring, onIntent = onIntent)
            MyGameHairline()
            MyGameOutlinedDoor(label = chromeResource(R.string.town_map_link), onClick = onMapOpen)
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
        MyGameTextLink(
            label = copy.chrome(R.string.town_goal_close),
            onClick = { onIntent(TownIntent.GoalClosed) },
        )
    }
}

@Composable
private fun BuildMarkRow(mark: DurationMark, modifier: Modifier = Modifier) {
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

private fun PlayerCopy.wordsOf(need: WordNeedLine): MyGamePlaceWords = MyGamePlaceWords(
    line = chrome(
        R.string.town_words_needed,
        "standing" to neededWordSelectorOf(need.standing),
        "needed" to need.needed.toString(),
        "held" to need.held.toString(),
    ),
    needed = need.needed,
    held = need.held,
)

internal fun CopyReader.levelLineOf(place: PlaceCard): String {
    if (place.next == null) return text(R.string.town_top_level)
    val inWork: String = text(R.string.town_in_work)
    if (place.level == 0) return if (place.isInWork) inWork else text(R.string.town_not_built)
    val level: String = text(R.string.town_level, "level" to place.level.toString())
    return if (place.isInWork) text(R.string.town_level_in_work, "level" to level, "inWork" to inWork) else level
}
