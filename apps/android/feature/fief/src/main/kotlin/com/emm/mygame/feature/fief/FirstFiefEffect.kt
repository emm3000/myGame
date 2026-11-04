package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.FiefId

sealed interface FirstFiefEffect {

    data class Opened(val fief: FiefId) : FirstFiefEffect

    data object SignedOut : FirstFiefEffect
}
