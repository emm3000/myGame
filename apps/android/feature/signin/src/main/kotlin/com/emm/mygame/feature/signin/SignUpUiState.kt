package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.SignUpRefusal

sealed interface SignUpUiState {

    val canSwitchToSignIn: Boolean
        get() = this is Form && status != FormStatus.Submitting

    data class Form(val email: String, val password: String, val fiefName: String, val status: FormStatus) :
        SignUpUiState

    sealed interface FormStatus {

        data object Idle : FormStatus

        data object Submitting : FormStatus

        data class Refused(val refusal: SignUpRefusal) : FormStatus

        data object Unreachable : FormStatus
    }
}
