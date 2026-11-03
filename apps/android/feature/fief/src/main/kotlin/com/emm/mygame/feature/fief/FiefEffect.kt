package com.emm.mygame.feature.fief

sealed interface FiefEffect {

    data object SignedOut : FiefEffect

    data object FoundingApplied : FiefEffect
}
