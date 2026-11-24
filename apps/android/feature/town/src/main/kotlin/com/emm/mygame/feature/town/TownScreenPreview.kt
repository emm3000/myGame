package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.NextLevelLine
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.SlotLine
import com.emm.mygame.feature.town.building.StartStatus
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.StopStatus
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.hiring.HiringCard
import com.emm.mygame.feature.town.hiring.HiringLine
import com.emm.mygame.feature.town.hiring.HiringOrderLine
import com.emm.mygame.feature.town.hiring.HiringPlaceStatus
import com.emm.mygame.feature.town.hiring.HiringStopStatus
import com.emm.mygame.feature.town.naming.NamingStatus
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes

private val previewGoal: TownGoal = TownGoal(
    position = 2,
    count = 9,
    building = TownBuildingKind.Factory,
    level = 1,
    state = TownGoal.State.Pending(
        resources = listOf(TownSnapshot.Cost(TownResourceKind.Money, 50)),
        people = 0,
    ),
)

private val previewHome: TownUiState.Content = TownUiState.Content(
    name = "Riverton",
    label = TownLabel.Town,
    stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
        StockLine(kind = kind, amount = 350, capacity = 1000, ratePerHour = 20, skillLevel = 0, fill = null)
    },
    people = PeopleLine(free = 19, atWork = 1),
    words = WordsLine(stable = 0, retained = 0),
    season = SeasonLine(
        kind = SeasonKind.Summer,
        year = 2,
        remaining = 3.days,
        productionMarks = listOf(ProductionMark(TownResourceKind.Food, percent = 125)),
    ),
    buildMark = DurationMark(SeasonKind.Summer, percent = 75),
    slot = SlotLine.Idle,
    waitingList = emptyList(),
    places = streetOrder.map { kind: TownBuildingKind ->
        PlaceCard(
            kind = kind,
            level = 0,
            raisedFrom = null,
            isInWork = false,
            next = NextLevelLine(
                level = 1,
                costs = listOf(
                    CostLine(TownResourceKind.Money, amount = 400, isShort = true),
                    CostLine(TownResourceKind.Material, amount = 120, isShort = false),
                ),
                duration = 2.minutes,
                people = 1,
                wordsNeeded = null,
            ),
            block = null,
        )
    },
    nextStepPlace = TownBuildingKind.Factory,
    goal = previewGoal,
    caughtUpGoal = previewGoal,
    newestText = NextStepText(TextId("text-31"), "The New Shop"),
    tip = TipKind.Seasons,
    start = StartStatus.Idle,
    stop = StopStatus.Idle,
    hiring = HiringLine(
        order = HiringOrderLine.Idle,
        hires = emptyList(),
        hireMark = null,
        place = HiringPlaceStatus.Idle,
        stop = HiringStopStatus.Idle,
    ),
)

private class TownScreenStates : PreviewParameterProvider<TownUiState> {

    override val values: Sequence<TownUiState> = sequenceOf(
        TownUiState.Loading,
        TownUiState.Failed,
        TownUiState.Naming(name = "Riverton", status = NamingStatus.Idle),
        previewHome,
        previewHome.copy(
            season = SeasonLine(
                kind = SeasonKind.Winter,
                year = 2,
                remaining = 2.days,
                productionMarks = listOf(ProductionMark(TownResourceKind.Power, percent = 75)),
            ),
            buildMark = null,
        ),
        previewHome.copy(
            season = SeasonLine(
                kind = SeasonKind.Spring,
                year = 2,
                remaining = 4.days,
                productionMarks = emptyList(),
            ),
            buildMark = null,
            hiring = previewHome.hiring.copy(
                hires = listOf(
                    HiringCard(TownHireKind.Truck, team = 0, requiredOfficeLevel = 3, form = null),
                ),
                hireMark = DurationMark(SeasonKind.Spring, percent = 75),
            ),
        ),
    )
}

private class TownLanguages : PreviewParameterProvider<CopyLanguage> {

    override val values: Sequence<CopyLanguage> = sequenceOf(
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.English),
    )
}

@PreviewMyGame
@Composable
private fun TownScreenLanguagePreview(@PreviewParameter(TownLanguages::class) language: CopyLanguage) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            TownScreen(
                state = previewHome,
                onIntent = {},
                onSchoolOpen = {},
                onMapOpen = {},
                onTextOpen = {},
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun TownScreenNamingBothPreview() {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            TownScreen(
                state = TownUiState.Naming(name = "Riverton", status = NamingStatus.Idle),
                onIntent = {},
                onSchoolOpen = {},
                onMapOpen = {},
                onTextOpen = {},
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun TownScreenPreview(@PreviewParameter(TownScreenStates::class) state: TownUiState) {
    MyGamePreviewSurface {
        TownScreen(
            state = state,
            onIntent = {},
            onSchoolOpen = {},
            onMapOpen = {},
            onTextOpen = {},
        )
    }
}
