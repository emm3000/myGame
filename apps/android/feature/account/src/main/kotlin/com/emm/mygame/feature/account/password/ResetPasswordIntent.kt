package com.emm.mygame.feature.account.password

sealed interface ResetPasswordIntent {

    data class PasswordChanged(val password: String) : ResetPasswordIntent

    data object SubmitTapped : ResetPasswordIntent
}
