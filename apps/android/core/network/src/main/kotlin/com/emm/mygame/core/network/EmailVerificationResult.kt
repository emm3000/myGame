package com.emm.mygame.core.network

sealed interface EmailVerificationResult {

    data object Verified : EmailVerificationResult

    data object LinkRefused : EmailVerificationResult

    data object Unreachable : EmailVerificationResult
}
