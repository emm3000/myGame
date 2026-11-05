package com.emm.mygame.feature.town

sealed interface TownEffect {

    data object SignedOut : TownEffect
}
