package com.emm.mygame.feature.signin

sealed interface SignUpIntent {

    data class EmailChanged(val email: String) : SignUpIntent

    data class PasswordChanged(val password: String) : SignUpIntent

    data class FiefNameChanged(val fiefName: String) : SignUpIntent

    data object SubmitTapped : SignUpIntent

    data object RetryTapped : SignUpIntent
}
