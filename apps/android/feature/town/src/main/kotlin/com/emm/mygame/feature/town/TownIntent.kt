package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownBuildingKind

sealed interface TownIntent {

    data object ScreenShown : TownIntent

    data object ScreenHidden : TownIntent

    data object RetryTapped : TownIntent

    data object SignOutTapped : TownIntent

    data class NameChanged(val name: String) : TownIntent

    data object NameSubmitted : TownIntent

    data object GoToTownTapped : TownIntent

    data class BuildTapped(val building: TownBuildingKind) : TownIntent

    data class StopTapped(val building: TownBuildingKind, val level: Int) : TownIntent
}
