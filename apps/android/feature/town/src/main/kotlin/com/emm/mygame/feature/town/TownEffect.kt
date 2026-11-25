package com.emm.mygame.feature.town

sealed interface TownEffect {

    data object SigningOut : TownEffect

    data object SignedOut : TownEffect

    data object Unnamed : TownEffect

    data object Named : TownEffect
}
