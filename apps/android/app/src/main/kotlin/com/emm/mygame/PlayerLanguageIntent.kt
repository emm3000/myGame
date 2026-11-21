package com.emm.mygame

internal sealed interface PlayerLanguageIntent {

    data object SessionClosed : PlayerLanguageIntent
}
