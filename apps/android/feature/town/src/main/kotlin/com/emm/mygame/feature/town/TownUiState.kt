package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.SlotLine
import com.emm.mygame.feature.town.building.StartStatus
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.StopStatus
import com.emm.mygame.feature.town.building.WaitingLine
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.hiring.HiringLine
import com.emm.mygame.feature.town.naming.NamingStatus

sealed interface TownUiState {

    val isDockWithheld: Boolean
        get() = when (this) {
            is Naming -> true
            is SigningOut -> isLeavingNaming
            Loading, Failed, is Content -> false
        }

    data object Loading : TownUiState

    data object Failed : TownUiState

    data class SigningOut(val isLeavingNaming: Boolean) : TownUiState

    data class Naming(val name: String, val status: NamingStatus) : TownUiState

    data class Content(
        val name: String,
        val label: TownLabel,
        val stocks: List<StockLine>,
        val people: PeopleLine,
        val words: WordsLine,
        val season: SeasonLine?,
        val buildMark: DurationMark?,
        val slot: SlotLine,
        val waitingList: List<WaitingLine>,
        val places: List<PlaceCard>,
        val nextStepPlace: TownBuildingKind,
        val goal: TownGoal?,
        val caughtUpGoal: TownGoal?,
        val newestText: NextStepText?,
        val tip: TipKind?,
        val start: StartStatus,
        val stop: StopStatus,
        val hiring: HiringLine,
    ) : TownUiState
}
