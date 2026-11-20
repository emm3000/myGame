package com.emm.mygame.feature.signin

sealed interface ResetPasswordUiState {

    data class Form(val password: String, val status: FormStatus) : ResetPasswordUiState

    data object Changed : ResetPasswordUiState

    data object LinkRefused : ResetPasswordUiState

    sealed interface FormStatus {

        data object Idle : FormStatus

        data object Sending : FormStatus

        data object WeakPassword : FormStatus

        data object Unexpected : FormStatus
    }
}
