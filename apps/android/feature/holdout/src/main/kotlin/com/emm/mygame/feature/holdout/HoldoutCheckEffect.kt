package com.emm.mygame.feature.holdout

sealed interface HoldoutCheckEffect {

    data object Ended : HoldoutCheckEffect
}
