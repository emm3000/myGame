package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.jobs.CleanUpQuoteResult
import com.emm.mygame.core.model.town.jobs.JobQuoteResult
import com.emm.mygame.core.model.town.jobs.RegionReader

internal sealed interface QuoteAnswer {

    val isUnreachable: Boolean

    data class Job(val quote: MapUiState.PayQuote) : QuoteAnswer {
        override val isUnreachable: Boolean = quote == MapUiState.PayQuote.Unreachable
    }

    data class CleanUp(val quote: MapUiState.CleanUpQuote) : QuoteAnswer {
        override val isUnreachable: Boolean = quote == MapUiState.CleanUpQuote.Unreachable
    }
}

internal fun payQuoteOf(result: JobQuoteResult): QuoteAnswer = QuoteAnswer.Job(
    when (result) {
        is JobQuoteResult.Quoted -> MapUiState.PayQuote.Quoted(payLinesOf(result.pay))
        is JobQuoteResult.Refused -> MapUiState.PayQuote.Refused(result.refusal)
        JobQuoteResult.Unreachable -> MapUiState.PayQuote.Unreachable
    },
)

internal fun cleanUpQuoteOf(result: CleanUpQuoteResult): QuoteAnswer = QuoteAnswer.CleanUp(
    when (result) {
        is CleanUpQuoteResult.Quoted -> MapUiState.CleanUpQuote.Quoted(
            strength = result.strength,
            waste = result.waste,
            pay = payLinesOf(result.pay),
            isShort = !result.covers,
        )
        is CleanUpQuoteResult.Refused -> MapUiState.CleanUpQuote.Refused(result.refusal)
        CleanUpQuoteResult.Unreachable -> MapUiState.CleanUpQuote.Unreachable
    },
)

internal suspend fun RegionReader.quoted(request: SiteSend): QuoteAnswer = when (request) {
    is SiteSend.Job -> payQuoteOf(quoteJob(request.target, request.team, request.hours))
    is SiteSend.CleanUp -> cleanUpQuoteOf(quoteCleanUp(request.target, request.team))
}
