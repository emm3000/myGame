package com.emm.mygame.core.network

sealed interface VerificationResendResult {

    data object Sent : VerificationResendResult

    data object MailNotSent : VerificationResendResult

    data object Unreachable : VerificationResendResult
}
