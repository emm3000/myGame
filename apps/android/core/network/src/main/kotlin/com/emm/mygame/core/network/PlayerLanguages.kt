package com.emm.mygame.core.network

import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class PlayerLanguages(tokenStore: TokenStore, private val onNamed: (PlayerLanguage) -> Unit) {

    private val holding: Any = Any()

    private val sentReads: AtomicLong = AtomicLong()

    private var lastForgottenOrder: Long = 0L

    private var newestScaffoldVersion: ScaffoldVersion? = null

    private var heldScaffold: Held<PlayerScaffold>? = null

    private var heldChromePhase: Held<PlayerChromePhase>? = null

    private val _language: MutableStateFlow<PlayerLanguage?> = MutableStateFlow(null)

    val language: StateFlow<PlayerLanguage?> = _language.asStateFlow()

    private val _scaffold: MutableStateFlow<PlayerScaffold?> = MutableStateFlow(null)

    val scaffold: StateFlow<PlayerScaffold?> = _scaffold.asStateFlow()

    init {
        tokenStore.onSessionChange(::forget)
    }

    internal fun sending(): LanguageRead = LanguageRead(order = sentReads.incrementAndGet())

    internal fun answered(read: LanguageRead, answer: LanguageAnswer) {
        synchronized(holding) {
            if (read.order <= lastForgottenOrder) return
            if (newestScaffoldVersion.isNewerThan(answer.scaffoldVersion)) return
            newestScaffoldVersion = answer.scaffoldVersion
            val freshness: Freshness = Freshness(answer.scaffoldVersion, read.order)
            heldScaffold = heldScaffold.fresherOf(answer.scaffold, freshness)
            heldChromePhase = heldChromePhase.fresherOf(answer.chromePhase, freshness)
            _scaffold.value = heldScaffold?.value
            _language.value = languageOf(heldScaffold?.value, heldChromePhase?.value)
            _language.value?.let(onNamed)
        }
    }

    private fun forget() {
        synchronized(holding) {
            lastForgottenOrder = sentReads.get()
            newestScaffoldVersion = null
            heldScaffold = null
            heldChromePhase = null
            _scaffold.value = null
            _language.value = null
        }
    }

    private data class Freshness(val scaffoldVersion: ScaffoldVersion, val order: Long) : Comparable<Freshness> {
        override fun compareTo(other: Freshness): Int =
            compareValuesBy(this, other, Freshness::scaffoldVersion, Freshness::order)
    }

    private data class Held<Value>(val value: Value, val freshness: Freshness)

    private fun <Value> Held<Value>?.fresherOf(answered: Value?, freshness: Freshness): Held<Value>? {
        if (answered == null) return this
        if (this != null && this.freshness > freshness) return this
        return Held(answered, freshness)
    }
}

@JvmInline
internal value class LanguageRead(val order: Long)

private fun ScaffoldVersion?.isNewerThan(answered: ScaffoldVersion): Boolean = this != null && this > answered

private fun languageOf(scaffold: PlayerScaffold?, chromePhase: PlayerChromePhase?): PlayerLanguage? {
    if (scaffold == null || chromePhase == null) return null
    return PlayerLanguage(scaffold, chromePhase)
}
