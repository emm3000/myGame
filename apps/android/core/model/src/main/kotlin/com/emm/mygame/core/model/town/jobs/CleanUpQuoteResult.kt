package com.emm.mygame.core.model.town.jobs

import com.emm.mygame.core.model.town.TownResourceKind

sealed interface CleanUpQuoteResult {

    data class Quoted(
        val strength: Int,
        val waste: Int,
        val pay: Map<TownResourceKind, Long>,
        val covers: Boolean,
    ) : CleanUpQuoteResult

    data class Refused(val refusal: TownJobRefusal) : CleanUpQuoteResult

    data object Unreachable : CleanUpQuoteResult
}
