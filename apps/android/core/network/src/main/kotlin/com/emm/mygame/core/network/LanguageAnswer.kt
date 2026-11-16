package com.emm.mygame.core.network

internal data class LanguageAnswer(
    val scaffold: PlayerScaffold?,
    val scaffoldVersion: ScaffoldVersion,
    val chromePhase: PlayerChromePhase?,
)
