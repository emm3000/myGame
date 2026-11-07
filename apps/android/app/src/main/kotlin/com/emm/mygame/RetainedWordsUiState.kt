package com.emm.mygame

internal sealed interface RetainedWordsUiState {

    data object Hidden : RetainedWordsUiState

    data class Shown(val count: Int, val total: Int) : RetainedWordsUiState
}
