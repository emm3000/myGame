package com.emm.mygame

internal sealed interface RetainedWordsIntent {

    data object ScreenShown : RetainedWordsIntent

    data object ScreenHidden : RetainedWordsIntent
}
