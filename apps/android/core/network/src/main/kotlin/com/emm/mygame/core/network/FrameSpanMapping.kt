package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FrameSpan as WireFrameSpan
import com.emm.mygame.core.network.generated.models.WordSupport as WireWordSupport

internal fun List<WireFrameSpan>.toFrameSpans(): List<FrameSpan> =
    map { span: WireFrameSpan -> FrameSpan(text = span.text, support = span.support?.toWordSupport()) }

internal fun WireWordSupport.toWordSupport(): WordSupport? {
    val knownShown: WordSupport.Shown = shown.toShown() ?: return null
    val knownLanguage: WordSupport.Language = language.toLanguage() ?: return null
    return WordSupport(shown = knownShown, text = text, language = knownLanguage)
}

private fun WireWordSupport.Shown.toShown(): WordSupport.Shown? = when (this) {
    WireWordSupport.Shown.beside -> WordSupport.Shown.Beside
    WireWordSupport.Shown.onTap -> WordSupport.Shown.OnTap
    WireWordSupport.Shown.unknown_default_open_api -> null
}

private fun WireWordSupport.Language.toLanguage(): WordSupport.Language? = when (this) {
    WireWordSupport.Language.es -> WordSupport.Language.Spanish
    WireWordSupport.Language.en -> WordSupport.Language.English
    WireWordSupport.Language.unknown_default_open_api -> null
}
