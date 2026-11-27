package com.emm.mygame.account

internal sealed interface PlayerLanguageIntent {

    data object SessionClosed : PlayerLanguageIntent
}
