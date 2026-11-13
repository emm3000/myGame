package com.emm.mygame.core.network

data class WordSupport(val shown: Shown, val text: String, val language: Language) {

    enum class Shown { Beside, OnTap }

    enum class Language(val tag: String) {
        Spanish("es"),
        English("en"),
    }
}
