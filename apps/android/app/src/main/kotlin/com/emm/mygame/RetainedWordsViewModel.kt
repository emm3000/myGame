package com.emm.mygame

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.registeredBetween
import com.emm.mygame.core.model.town.school.RetainedWords
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal class RetainedWordsViewModel(
    private val towns: TownReader,
    private val doesScreenReadTown: Boolean,
) : ViewModel() {

    private val _state: MutableStateFlow<RetainedWordsUiState> =
        MutableStateFlow(uiStateOf(previous = null, next = towns.town.value?.town))

    val state: StateFlow<RetainedWordsUiState> = _state.asStateFlow()

    private var held: TownSnapshot? = towns.town.value?.town

    private var reading: Job? = null

    init {
        viewModelScope.launch { towns.town.collect { next: HeldTown? -> hold(next?.town) } }
    }

    fun onIntent(intent: RetainedWordsIntent) {
        when (intent) {
            RetainedWordsIntent.ScreenShown -> read()
            RetainedWordsIntent.ScreenHidden -> reading?.cancel()
        }
    }

    private fun hold(next: TownSnapshot?) {
        _state.value = uiStateOf(previous = held, next = next)
        held = next
    }

    private fun read() {
        if (doesScreenReadTown) return
        reading?.cancel()
        reading = viewModelScope.launch { towns.read() }
    }
}

private fun uiStateOf(previous: TownSnapshot?, next: TownSnapshot?): RetainedWordsUiState {
    val words: RetainedWords = next?.learning?.retainedWords ?: return RetainedWordsUiState.Hidden
    val rise: TownRegistered.RingRise? = previous?.let { held: TownSnapshot -> registeredBetween(held, next).ringRise }
    return RetainedWordsUiState.Shown(
        count = words.count,
        total = words.total,
        countBefore = rise?.countBefore ?: words.count,
    )
}
