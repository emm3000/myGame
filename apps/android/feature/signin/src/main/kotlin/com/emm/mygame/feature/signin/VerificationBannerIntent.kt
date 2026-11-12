package com.emm.mygame.feature.signin

sealed interface VerificationBannerIntent {

    data object ScreenShown : VerificationBannerIntent

    data object ScreenHidden : VerificationBannerIntent

    data object ResendTapped : VerificationBannerIntent

    data object SessionClosed : VerificationBannerIntent
}
