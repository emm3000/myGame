package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold

sealed interface SettingsUiState {

    data object Loading : SettingsUiState

    data object Failed : SettingsUiState

    data class Loaded(val stored: PlayerScaffold, val change: Change) : SettingsUiState {

        val shown: PlayerScaffold
            get() = if (change is Change.Saving) change.scaffold else stored

        val isSaving: Boolean
            get() = change is Change.Saving
    }

    sealed interface Change {

        data object Untouched : Change

        data class Saving(val scaffold: PlayerScaffold) : Change

        data object Saved : Change

        data object Refused : Change

        data object Unreachable : Change
    }
}
