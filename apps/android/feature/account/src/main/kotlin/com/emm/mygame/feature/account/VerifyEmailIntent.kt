package com.emm.mygame.feature.account

sealed interface VerifyEmailIntent {

    data object RetryTapped : VerifyEmailIntent
}
