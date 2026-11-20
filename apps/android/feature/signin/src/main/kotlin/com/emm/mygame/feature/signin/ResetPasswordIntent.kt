package com.emm.mygame.feature.signin

sealed interface ResetPasswordIntent {

    data class PasswordChanged(val password: String) : ResetPasswordIntent

    data object SubmitTapped : ResetPasswordIntent
}
