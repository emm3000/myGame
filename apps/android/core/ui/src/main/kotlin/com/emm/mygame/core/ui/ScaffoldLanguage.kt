package com.emm.mygame.core.ui

import java.util.Locale

enum class ScaffoldLanguage {
    Spanish,
    None,
}

internal val americanEnglish: Locale = Locale.forLanguageTag("en-US")

internal fun ScaffoldLanguage.locale(): Locale = when (this) {
    ScaffoldLanguage.Spanish -> Locale.forLanguageTag("es")
    ScaffoldLanguage.None -> americanEnglish
}
