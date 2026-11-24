package com.emm.mygame.core.model.account

sealed interface VerificationResendResult {

    data object Sent : VerificationResendResult

    data object MailNotSent : VerificationResendResult

    data object Unreachable : VerificationResendResult
}
