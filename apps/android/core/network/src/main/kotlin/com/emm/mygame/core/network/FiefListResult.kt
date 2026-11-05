package com.emm.mygame.core.network

sealed interface FiefListResult {

    data class Listed(val fiefs: List<ListedFief>) : FiefListResult

    data object Unreachable : FiefListResult

    data object Failed : FiefListResult
}
