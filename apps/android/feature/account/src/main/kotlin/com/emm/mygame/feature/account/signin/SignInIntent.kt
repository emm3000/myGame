package com.emm.mygame.feature.account.signin

sealed interface SignInIntent {

    data class EmailChanged(val email: String) : SignInIntent

    data class PasswordChanged(val password: String) : SignInIntent

    data object SubmitTapped : SignInIntent

    data object RetryTapped : SignInIntent
}
