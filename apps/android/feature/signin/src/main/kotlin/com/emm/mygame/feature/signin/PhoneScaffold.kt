package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold
import java.util.Locale

internal fun phoneScaffoldOf(phoneLocale: Locale): PlayerScaffold =
    if (phoneLocale.language == SPANISH) PlayerScaffold.Spanish else PlayerScaffold.None

private const val SPANISH: String = "es"
