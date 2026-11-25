package com.emm.mygame.feature.jobs

import kotlin.time.Instant

internal data class QuoteAsk(val send: SiteSend, val seasonEndsAt: Instant?)

internal fun askingFor(ask: QuoteAsk): QuoteAnswer = when (ask.send) {
    is SiteSend.Job -> QuoteAnswer.Job(MapUiState.PayQuote.Asking)
    is SiteSend.CleanUp -> QuoteAnswer.CleanUp(MapUiState.CleanUpQuote.Asking)
}
