package com.emm.mygame.feature.map

import com.emm.mygame.core.network.CleanUpQuoteResult
import com.emm.mygame.core.network.JobQuoteResult
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.RegionReader
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Instant

internal data class QuoteAsk(val send: SiteSend, val seasonEndsAt: Instant?)

internal sealed interface QuoteAnswer {

    val isUnreachable: Boolean

    data class Job(val quote: MapUiState.PayQuote) : QuoteAnswer {
        override val isUnreachable: Boolean = quote == MapUiState.PayQuote.Unreachable
    }

    data class CleanUp(val quote: MapUiState.CleanUpQuote) : QuoteAnswer {
        override val isUnreachable: Boolean = quote == MapUiState.CleanUpQuote.Unreachable
    }
}

internal fun quoteAskOf(map: RegionMap, town: TownSnapshot, choices: MapChoices): QuoteAsk? {
    val site: Int = choices.chosen ?: return null
    val send: SiteSend = siteSendOf(map, site, choices.entries) ?: return null
    if (send.team.values.sum() == 0) return null
    return QuoteAsk(send, town.seasonEndsAt)
}

internal fun askingFor(ask: QuoteAsk): QuoteAnswer = when (ask.send) {
    is SiteSend.Job -> QuoteAnswer.Job(MapUiState.PayQuote.Asking)
    is SiteSend.CleanUp -> QuoteAnswer.CleanUp(MapUiState.CleanUpQuote.Asking)
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
            isShort = result.strength < result.waste,
        )
        is CleanUpQuoteResult.Refused -> MapUiState.CleanUpQuote.Refused(result.refusal)
        CleanUpQuoteResult.Unreachable -> MapUiState.CleanUpQuote.Unreachable
    },
)

internal suspend fun RegionReader.quoted(request: SiteSend): QuoteAnswer = when (request) {
    is SiteSend.Job -> payQuoteOf(quoteJob(request.target, request.team, request.hours))
    is SiteSend.CleanUp -> cleanUpQuoteOf(quoteCleanUp(request.target, request.team))
}
