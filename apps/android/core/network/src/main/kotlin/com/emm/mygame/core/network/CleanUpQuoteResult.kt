package com.emm.mygame.core.network

sealed interface CleanUpQuoteResult {

    data class Quoted(val strength: Int, val waste: Int, val pay: Map<TownResourceKind, Long>) : CleanUpQuoteResult

    data class Refused(val refusal: TownJobRefusal) : CleanUpQuoteResult

    data object Unreachable : CleanUpQuoteResult
}
