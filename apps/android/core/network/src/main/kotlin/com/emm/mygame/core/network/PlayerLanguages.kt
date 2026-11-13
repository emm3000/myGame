package com.emm.mygame.core.network

import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class PlayerLanguages(tokenStore: TokenStore) {

    private val holding: Any = Any()

    private val sentReads: AtomicLong = AtomicLong()

    private var lastForgottenOrder: Long = 0L

    private var scaffold: Held<PlayerScaffold>? = null

    private var chromePhase: Held<PlayerChromePhase>? = null

    private val _language: MutableStateFlow<PlayerLanguage?> = MutableStateFlow(null)

    val language: StateFlow<PlayerLanguage?> = _language.asStateFlow()

    init {
        tokenStore.onSessionChange(::forget)
    }

    internal fun sending(): LanguageRead = LanguageRead(order = sentReads.incrementAndGet())

    internal fun answered(read: LanguageRead, answeredScaffold: PlayerScaffold?, answeredPhase: PlayerChromePhase?) {
        synchronized(holding) {
            if (read.order <= lastForgottenOrder) return
            scaffold = scaffold.fresherOf(answeredScaffold, read.order)
            chromePhase = chromePhase.fresherOf(answeredPhase, read.order)
            _language.value = languageOf(scaffold?.value, chromePhase?.value)
        }
    }

    private fun forget() {
        synchronized(holding) {
            lastForgottenOrder = sentReads.get()
            scaffold = null
            chromePhase = null
            _language.value = null
        }
    }

    private data class Held<Value>(val value: Value, val order: Long)

    private fun <Value> Held<Value>?.fresherOf(answered: Value?, order: Long): Held<Value>? {
        if (answered == null) return this
        if (this != null && this.order > order) return this
        return Held(answered, order)
    }
}

@JvmInline
internal value class LanguageRead(val order: Long)

private fun languageOf(scaffold: PlayerScaffold?, chromePhase: PlayerChromePhase?): PlayerLanguage? {
    if (scaffold == null || chromePhase == null) return null
    return PlayerLanguage(scaffold, chromePhase)
}
