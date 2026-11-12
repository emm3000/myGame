package com.emm.mygame.core.network

sealed interface TownNewsReadResult {

    data class Read(val news: List<TownNews>) : TownNewsReadResult

    data object Unreachable : TownNewsReadResult
}
