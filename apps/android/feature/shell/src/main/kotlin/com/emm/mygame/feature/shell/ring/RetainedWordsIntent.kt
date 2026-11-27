package com.emm.mygame.feature.shell.ring

sealed interface RetainedWordsIntent {

    data object ScreenShown : RetainedWordsIntent

    data object ScreenHidden : RetainedWordsIntent
}
