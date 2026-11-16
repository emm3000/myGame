package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ScaffoldChangeResult
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val sessions: SessionRepository,
    private val playerScaffold: StateFlow<PlayerScaffold?>,
) : ViewModel() {

    private val _state: MutableStateFlow<SettingsUiState> = MutableStateFlow(SettingsUiState.Loading)

    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    init {
        read()
        viewModelScope.launch { playerScaffold.collect(::holdStored) }
    }

    fun onIntent(intent: SettingsIntent) {
        when (intent) {
            is SettingsIntent.ScaffoldPicked -> change(intent.scaffold)
            SettingsIntent.RetryTapped -> retry()
        }
    }

    private fun read() {
        _state.value = SettingsUiState.Loading
        viewModelScope.launch {
            _state.value = settingsOf(sessions.restore(), playerScaffold.value)
        }
    }

    private fun holdStored(held: PlayerScaffold?) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        val stored: PlayerScaffold = held ?: return
        _state.value = loaded.copy(stored = stored)
    }

    private fun retry() {
        if (_state.value == SettingsUiState.Failed) read()
    }

    private fun change(scaffold: PlayerScaffold) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        if (loaded.isSaving || scaffold == loaded.stored) return
        _state.value = loaded.copy(change = SettingsUiState.Change.Saving(scaffold))
        viewModelScope.launch {
            answered(sessions.changeScaffold(scaffold))
        }
    }

    private fun answered(answer: ScaffoldChangeResult) {
        val current: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        val stored: PlayerScaffold = playerScaffold.value ?: current.stored
        _state.value = SettingsUiState.Loaded(stored = stored, change = changeOf(answer))
    }
}

private fun settingsOf(read: RestoreResult, held: PlayerScaffold?): SettingsUiState = when (read) {
    is RestoreResult.SignedIn -> storedSettingsOf(held ?: read.player.scaffold)
    RestoreResult.SignedOut, RestoreResult.Unreachable -> SettingsUiState.Failed
}

private fun storedSettingsOf(stored: PlayerScaffold?): SettingsUiState {
    if (stored == null) return SettingsUiState.Failed
    return SettingsUiState.Loaded(stored = stored, change = SettingsUiState.Change.Untouched)
}

private fun changeOf(answer: ScaffoldChangeResult): SettingsUiState.Change = when (answer) {
    is ScaffoldChangeResult.Changed -> savedOf(answer.player.scaffold)
    ScaffoldChangeResult.Refused -> SettingsUiState.Change.Refused
    ScaffoldChangeResult.Unreachable -> SettingsUiState.Change.Unreachable
}

private fun savedOf(answered: PlayerScaffold?): SettingsUiState.Change =
    if (answered == null) SettingsUiState.Change.Unreachable else SettingsUiState.Change.Saved
