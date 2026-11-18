package com.emm.mygame.feature.placement

sealed interface HoldoutCheckEffect {

    data object Ended : HoldoutCheckEffect
}
