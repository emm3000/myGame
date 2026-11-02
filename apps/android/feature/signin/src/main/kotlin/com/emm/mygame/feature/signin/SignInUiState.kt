package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.RefusalKind

sealed interface SignInUiState {

    data object CheckingSession : SignInUiState

    data class Form(val email: String, val password: String, val status: FormStatus) : SignInUiState

    data class SignedIn(val email: String) : SignInUiState

    sealed interface FormStatus {

        data object Idle : FormStatus

        data object Submitting : FormStatus

        data class Refused(val kind: RefusalKind) : FormStatus

        data class Unreachable(val failedAttempt: Attempt) : FormStatus
    }

    enum class Attempt {
        SessionCheck,
        SignIn,
    }
}
