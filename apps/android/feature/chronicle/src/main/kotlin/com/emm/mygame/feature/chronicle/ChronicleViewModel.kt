package com.emm.mygame.feature.chronicle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ChronicleReadResult
import com.emm.mygame.core.network.ChronicleRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ChronicleViewModel(private val chronicles: ChronicleRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<ChronicleUiState> = MutableStateFlow(ChronicleUiState.Loading)

    val state: StateFlow<ChronicleUiState> = _state.asStateFlow()

    init {
        read()
    }

    fun onIntent(intent: ChronicleIntent) {
        when (intent) {
            ChronicleIntent.RetryTapped -> retry()
        }
    }

    private fun retry() {
        if (_state.value == ChronicleUiState.Failed) read()
    }

    private fun read() {
        _state.value = ChronicleUiState.Loading
        viewModelScope.launch {
            _state.value = when (val answer: ChronicleReadResult = chronicles.read()) {
                is ChronicleReadResult.Read ->
                    if (answer.events.isEmpty()) {
                        ChronicleUiState.Empty
                    } else {
                        ChronicleUiState.Content(events = answer.events, readAt = clock.now())
                    }
                ChronicleReadResult.Unreachable -> ChronicleUiState.Failed
            }
        }
    }
}
