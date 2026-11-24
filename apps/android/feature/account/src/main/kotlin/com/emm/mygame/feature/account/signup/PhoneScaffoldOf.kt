package com.emm.mygame.feature.account.signup

import com.emm.mygame.core.model.account.PlayerScaffold
import java.util.Locale

internal fun phoneScaffoldOf(phoneLocale: Locale): PlayerScaffold =
    if (phoneLocale.language == SPANISH) PlayerScaffold.Spanish else PlayerScaffold.None

private const val SPANISH: String = "es"
