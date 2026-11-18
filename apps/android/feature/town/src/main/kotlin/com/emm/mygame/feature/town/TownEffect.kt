package com.emm.mygame.feature.town

sealed interface TownEffect {

    data object SigningOut : TownEffect

    data object SignedOut : TownEffect
}
