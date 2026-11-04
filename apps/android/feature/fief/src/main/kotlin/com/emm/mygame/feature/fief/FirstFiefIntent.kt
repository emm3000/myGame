package com.emm.mygame.feature.fief

sealed interface FirstFiefIntent {

    data object RetryTapped : FirstFiefIntent

    data object SignOutTapped : FirstFiefIntent
}
