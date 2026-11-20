package com.emm.mygame.feature.signin

sealed interface VerifyEmailIntent {

    data object RetryTapped : VerifyEmailIntent
}
