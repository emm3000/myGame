package com.emm.mygame.feature.account.verification

sealed interface VerifyEmailIntent {

    data object RetryTapped : VerifyEmailIntent
}
