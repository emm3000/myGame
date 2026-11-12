package com.emm.mygame.feature.signin

sealed interface VerificationBannerUiState {

    data object Hidden : VerificationBannerUiState

    data class Unverified(val resend: Resend) : VerificationBannerUiState

    sealed interface Resend {

        data object Idle : Resend

        data object Sending : Resend

        data object Sent : Resend

        data object MailNotSent : Resend

        data object Unreachable : Resend
    }
}
