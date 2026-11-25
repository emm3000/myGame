package com.emm.mygame.feature.jobs

internal data class MapQuote(val ask: QuoteAsk?, val answer: QuoteAnswer?) {

    fun drawn(): QuoteAnswer? = ask?.let { asked: QuoteAsk -> answer ?: askingFor(asked) }

    companion object {
        val none: MapQuote = MapQuote(ask = null, answer = null)
    }
}
