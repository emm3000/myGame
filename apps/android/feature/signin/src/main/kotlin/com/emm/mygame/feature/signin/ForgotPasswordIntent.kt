package com.emm.mygame.feature.signin

sealed interface ForgotPasswordIntent {

    data class EmailChanged(val email: String) : ForgotPasswordIntent

    data object SubmitTapped : ForgotPasswordIntent
}
