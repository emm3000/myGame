package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.jobs.RegionMap
import com.emm.mygame.core.model.town.jobs.RegionReader
import kotlin.time.Instant

internal data class QuoteAsk(val send: SiteSend, val seasonEndsAt: Instant?)

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

internal suspend fun RegionReader.quoted(request: SiteSend): QuoteAnswer = when (request) {
    is SiteSend.Job -> payQuoteOf(quoteJob(request.target, request.team, request.hours))
    is SiteSend.CleanUp -> cleanUpQuoteOf(quoteCleanUp(request.target, request.team))
}
