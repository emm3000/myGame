package com.emm.mygame.feature.town

import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand

sealed interface TownEffect {

    data object SignedOut : TownEffect

    data class HoldoutCheckOpened(val band: PlacementBand, val week: HoldoutCheckWeek) : TownEffect
}
