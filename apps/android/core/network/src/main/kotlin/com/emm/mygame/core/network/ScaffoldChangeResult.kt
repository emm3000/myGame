package com.emm.mygame.core.network

sealed interface ScaffoldChangeResult {

    data class Changed(val player: SignedInPlayer) : ScaffoldChangeResult

    data object Refused : ScaffoldChangeResult

    data object Unreachable : ScaffoldChangeResult
}
