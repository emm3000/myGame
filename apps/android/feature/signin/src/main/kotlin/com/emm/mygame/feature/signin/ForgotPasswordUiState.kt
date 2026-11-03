package com.emm.mygame.feature.signin

sealed interface ForgotPasswordUiState {

    data class Form(val email: String, val status: FormStatus) : ForgotPasswordUiState

    data object Sent : ForgotPasswordUiState

    sealed interface FormStatus {

        data object Idle : FormStatus

        data object Sending : FormStatus

        data object MalformedEmail : FormStatus

        data object Unexpected : FormStatus
    }
}
