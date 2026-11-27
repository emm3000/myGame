package com.emm.mygame.feature.account.password

sealed interface ForgotPasswordUiState {

    val canSwitchToSignIn: Boolean
        get() = this !is Form || status != FormStatus.Sending

    data class Form(val email: String, val status: FormStatus) : ForgotPasswordUiState

    data object Sent : ForgotPasswordUiState

    sealed interface FormStatus {

        data object Idle : FormStatus

        data object Sending : FormStatus

        data object MalformedEmail : FormStatus

        data object Unexpected : FormStatus
    }
}
