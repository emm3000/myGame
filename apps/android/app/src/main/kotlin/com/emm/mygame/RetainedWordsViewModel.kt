package com.emm.mygame

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.TownRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

internal class RetainedWordsViewModel(
    private val towns: TownRepository,
    private val doesScreenReadTown: Boolean,
) : ViewModel() {

    val state: StateFlow<RetainedWordsUiState> = towns.retainedWords
        .map(::uiStateOf)
        .stateIn(viewModelScope, SharingStarted.Eagerly, uiStateOf(towns.retainedWords.value))

    private var reading: Job? = null

    fun onIntent(intent: RetainedWordsIntent) {
        when (intent) {
            RetainedWordsIntent.ScreenShown -> read()
            RetainedWordsIntent.ScreenHidden -> reading?.cancel()
        }
    }

    private fun read() {
        if (doesScreenReadTown) return
        reading?.cancel()
        reading = viewModelScope.launch { towns.read() }
    }
}

private fun uiStateOf(words: RetainedWords?): RetainedWordsUiState =
    if (words == null) RetainedWordsUiState.Hidden else RetainedWordsUiState.Shown(words.count, words.total)
