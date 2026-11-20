package com.emm.mygame.core.network

sealed interface TownTextResult {

    data class Read(val text: OpenText) : TownTextResult

    data object NotOpen : TownTextResult

    data object NoTown : TownTextResult

    data object Unreachable : TownTextResult
}
