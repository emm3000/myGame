package com.emm.mygame.feature.placement

sealed interface PlacementEffect {

    data object Ended : PlacementEffect
}
