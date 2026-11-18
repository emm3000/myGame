package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind

sealed interface TownIntent {

    data object ScreenShown : TownIntent

    data object ScreenHidden : TownIntent

    data object RetryTapped : TownIntent

    data class NameChanged(val name: String) : TownIntent

    data object NameSubmitted : TownIntent

    data object GoToTownTapped : TownIntent

    data class BuildTapped(val building: TownBuildingKind) : TownIntent

    data class StopTapped(val building: TownBuildingKind, val level: Int) : TownIntent

    data class HireEntryChanged(val hire: TownHireKind, val entry: String) : TownIntent

    data class HireTapped(val hire: TownHireKind) : TownIntent

    data class StopHiringTapped(val target: TownUiState.HiringTarget) : TownIntent

    data class TipClosed(val tip: TipKind) : TownIntent

    data object GoalClosed : TownIntent

    data object SignOutTapped : TownIntent
}
