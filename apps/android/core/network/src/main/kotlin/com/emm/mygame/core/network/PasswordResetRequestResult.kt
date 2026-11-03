package com.emm.mygame.core.network

sealed interface PasswordResetRequestResult {

    data object Requested : PasswordResetRequestResult

    data object MalformedEmail : PasswordResetRequestResult

    data object Unreachable : PasswordResetRequestResult
}
