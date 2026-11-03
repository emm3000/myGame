package com.emm.mygame.core.network

sealed interface FirstFiefResult {

    data class Listed(val fief: FiefId) : FirstFiefResult

    data object NoFief : FirstFiefResult

    data object Unreachable : FirstFiefResult
}
