package com.emm.mygame.feature.fief

sealed interface FirstFiefUiState {

    data object Loading : FirstFiefUiState

    data object NoFief : FirstFiefUiState

    data object Unreachable : FirstFiefUiState
}
