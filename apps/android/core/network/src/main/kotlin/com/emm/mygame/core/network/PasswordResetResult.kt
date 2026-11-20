package com.emm.mygame.core.network

sealed interface PasswordResetResult {

    data object Changed : PasswordResetResult

    data object LinkRefused : PasswordResetResult

    data object WeakPassword : PasswordResetResult

    data object Unreachable : PasswordResetResult
}
