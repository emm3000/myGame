package com.emm.mygame.feature.account

sealed interface VerifyEmailUiState {

    data object Verifying : VerifyEmailUiState

    data object Verified : VerifyEmailUiState

    data object LinkRefused : VerifyEmailUiState

    data object Unexpected : VerifyEmailUiState
}
