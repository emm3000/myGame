package com.emm.mygame.feature.fief

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.FirstFiefResult
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.cancelChildren
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class FirstFiefViewModel(
    private val listings: FiefListRepository,
    private val sessions: SessionRepository,
) : ViewModel() {

    private val _state: MutableStateFlow<FirstFiefUiState> = MutableStateFlow(FirstFiefUiState.Loading)

    val state: StateFlow<FirstFiefUiState> = _state.asStateFlow()

    private val _effects: Channel<FirstFiefEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<FirstFiefEffect> = _effects.receiveAsFlow()

    init {
        list()
    }

    fun onIntent(intent: FirstFiefIntent) {
        if (_state.value == FirstFiefUiState.SigningOut) return
        when (intent) {
            FirstFiefIntent.RetryTapped -> if (_state.value != FirstFiefUiState.Loading) list()
            FirstFiefIntent.SignOutTapped -> signOut()
        }
    }

    private fun list() {
        _state.value = FirstFiefUiState.Loading
        viewModelScope.launch {
            when (val answer: FirstFiefResult = listings.firstListed()) {
                is FirstFiefResult.Listed -> _effects.send(FirstFiefEffect.Opened(answer.fief))
                FirstFiefResult.NoFief -> _state.value = FirstFiefUiState.NoFief
                FirstFiefResult.Unreachable -> _state.value = FirstFiefUiState.Unreachable
            }
        }
    }

    private fun signOut() {
        viewModelScope.coroutineContext.cancelChildren()
        _state.value = FirstFiefUiState.SigningOut
        viewModelScope.launch {
            sessions.signOut()
            _effects.send(FirstFiefEffect.SignedOut)
        }
    }
}
