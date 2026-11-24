package com.emm.mygame.feature.account.password

sealed interface ForgotPasswordIntent {

    data class EmailChanged(val email: String) : ForgotPasswordIntent

    data object SubmitTapped : ForgotPasswordIntent
}
