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

class SettingsViewModel(private val sessions: SessionRepository) : ViewModel() {

    private val _state: MutableStateFlow<SettingsUiState> = MutableStateFlow(SettingsUiState.Loading)

    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    init {
        read()
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
            _state.value = settingsOf(sessions.restore())
        }
    }

    private fun retry() {
        if (_state.value == SettingsUiState.Failed) read()
    }

    private fun change(scaffold: PlayerScaffold) {
        val loaded: SettingsUiState.Loaded = _state.value as? SettingsUiState.Loaded ?: return
        if (loaded.isSaving || scaffold == loaded.stored) return
        _state.value = loaded.copy(change = SettingsUiState.Change.Saving(scaffold))
        viewModelScope.launch {
            _state.value = loaded.answeredBy(sessions.changeScaffold(scaffold))
        }
    }
}

private fun settingsOf(read: RestoreResult): SettingsUiState = when (read) {
    is RestoreResult.SignedIn -> storedSettingsOf(read.player.scaffold)
    RestoreResult.SignedOut, RestoreResult.Unreachable -> SettingsUiState.Failed
}

private fun storedSettingsOf(stored: PlayerScaffold?): SettingsUiState {
    if (stored == null) return SettingsUiState.Failed
    return SettingsUiState.Loaded(stored = stored, change = SettingsUiState.Change.Untouched)
}

private fun SettingsUiState.Loaded.answeredBy(answer: ScaffoldChangeResult): SettingsUiState.Loaded = when (answer) {
    is ScaffoldChangeResult.Changed -> savedAs(answer.player.scaffold)
    ScaffoldChangeResult.Refused -> copy(change = SettingsUiState.Change.Refused)
    ScaffoldChangeResult.Unreachable -> copy(change = SettingsUiState.Change.Unreachable)
}

private fun SettingsUiState.Loaded.savedAs(answered: PlayerScaffold?): SettingsUiState.Loaded {
    if (answered == null) return copy(change = SettingsUiState.Change.Unreachable)
    return SettingsUiState.Loaded(stored = answered, change = SettingsUiState.Change.Saved)
}
