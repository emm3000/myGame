package com.emm.mygame

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.account.PlayerLanguage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.launch

internal class PlayerLanguageViewModel(private val read: StateFlow<PlayerLanguage?>) : ViewModel() {

    private val _state: MutableStateFlow<PlayerLanguageUiState> =
        MutableStateFlow(PlayerLanguageUiState(language = read.value))

    val state: StateFlow<PlayerLanguageUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            read.filterNotNull().collect { known: PlayerLanguage -> _state.value = PlayerLanguageUiState(known) }
        }
    }

    fun onIntent(intent: PlayerLanguageIntent) {
        when (intent) {
            PlayerLanguageIntent.SessionClosed -> _state.value = PlayerLanguageUiState(language = read.value)
        }
    }
}
