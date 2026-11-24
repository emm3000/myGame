package com.emm.mygame.core.model.town.news

sealed interface TownNewsReadResult {

    data class Read(val news: List<TownNews>) : TownNewsReadResult

    data object Unreachable : TownNewsReadResult
}
