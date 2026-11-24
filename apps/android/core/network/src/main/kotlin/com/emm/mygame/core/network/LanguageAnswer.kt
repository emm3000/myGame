package com.emm.mygame.core.network

import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerScaffold

internal data class LanguageAnswer(
    val scaffold: PlayerScaffold?,
    val scaffoldVersion: ScaffoldVersion,
    val chromePhase: PlayerChromePhase?,
)
