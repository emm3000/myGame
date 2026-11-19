package com.emm.mygame.feature.school

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class SchoolTextViewModel(private val text: TextId, private val towns: TownRepository) : ViewModel() {

    private val _state: MutableStateFlow<SchoolTextUiState> = MutableStateFlow(SchoolTextUiState.Loading)

    val state: StateFlow<SchoolTextUiState> = _state.asStateFlow()

    private val _effects: Channel<SchoolTextEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<SchoolTextEffect> = _effects.receiveAsFlow()

    init {
        open()
    }

    fun onIntent(intent: SchoolTextIntent) {
        when (intent) {
            SchoolTextIntent.RetryTapped -> if (_state.value == SchoolTextUiState.Failed) open()
            is SchoolTextIntent.WordTapped -> tap(intent.at)
        }
    }

    private fun open() {
        _state.value = SchoolTextUiState.Loading
        viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> _state.value = answer.town.readingOf(text)
                TownReadResult.NoTown -> _effects.send(SchoolTextEffect.NoTown)
                TownReadResult.Unreachable -> _state.value = SchoolTextUiState.Failed
            }
        }
    }

    private fun tap(at: SchoolTextUiState.SpanAt) {
        val reading: SchoolTextUiState.Reading = _state.value as? SchoolTextUiState.Reading ?: return
        _state.value = reading.copy(tapped = if (reading.tapped == at) null else at)
    }
}

private fun TownSnapshot.readingOf(text: TextId): SchoolTextUiState {
    val open: TownSnapshot.OpenText = texts.firstOrNull { candidate: TownSnapshot.OpenText -> candidate.id == text }
        ?: return SchoolTextUiState.NotOpen
    return SchoolTextUiState.Reading(open, tapped = null)
}
