package com.emm.mygame.feature.shell.ring

sealed interface RetainedWordsUiState {

    data object Hidden : RetainedWordsUiState

    data class Shown(val count: Int, val total: Int, val countBefore: Int) : RetainedWordsUiState
}
