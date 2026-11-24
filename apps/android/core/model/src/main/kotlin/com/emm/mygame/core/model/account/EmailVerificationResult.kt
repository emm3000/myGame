package com.emm.mygame.core.model.account

sealed interface EmailVerificationResult {

    data object Verified : EmailVerificationResult

    data object LinkRefused : EmailVerificationResult

    data object Unreachable : EmailVerificationResult
}
