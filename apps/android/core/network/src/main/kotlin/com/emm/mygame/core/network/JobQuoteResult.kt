package com.emm.mygame.core.network

sealed interface JobQuoteResult {

    data class Quoted(val pay: Map<TownResourceKind, Long>) : JobQuoteResult

    data class Refused(val refusal: TownJobRefusal) : JobQuoteResult

    data object Unreachable : JobQuoteResult
}
