package com.emm.mygame.core.model.account

sealed interface PasswordResetResult {

    data object Changed : PasswordResetResult

    data object LinkRefused : PasswordResetResult

    data object WeakPassword : PasswordResetResult

    data object Unreachable : PasswordResetResult
}
