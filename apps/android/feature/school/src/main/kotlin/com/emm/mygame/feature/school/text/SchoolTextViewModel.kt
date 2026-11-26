package com.emm.mygame.feature.school.text

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.model.town.TownTextResult
import com.emm.mygame.core.ui.ReadingSpan
import com.emm.mygame.core.ui.afterTapOn
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class SchoolTextViewModel(private val text: TextId, private val texts: TownTextRepository) : ViewModel() {

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
            when (val answer: TownTextResult = texts.readText(text)) {
                is TownTextResult.Read -> _state.value = SchoolTextUiState.Reading(answer.text, tapped = null)
                TownTextResult.NotOpen -> _state.value = SchoolTextUiState.NotOpen
                TownTextResult.NoTown -> _effects.send(SchoolTextEffect.NoTown)
                TownTextResult.Unreachable -> _state.value = SchoolTextUiState.Failed
            }
        }
    }

    private fun tap(at: ReadingSpan) {
        val reading: SchoolTextUiState.Reading = _state.value as? SchoolTextUiState.Reading ?: return
        _state.value = reading.copy(tapped = reading.tapped.afterTapOn(at))
    }
}
