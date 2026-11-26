package com.emm.mygame.feature.account.settings

import com.emm.mygame.core.model.account.PlayerScaffold
import java.time.LocalTime

sealed interface SettingsUiState {

    data object Loading : SettingsUiState

    data object Failed : SettingsUiState

    data object SigningOut : SettingsUiState

    data class Loaded(val stored: PlayerScaffold, val change: Change, val reminder: Reminder) : SettingsUiState {

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

    data class Reminder(val isOn: Boolean, val time: LocalTime, val ask: NotificationAsk, val isOffered: Boolean)

    sealed interface NotificationAsk {

        data object Untouched : NotificationAsk

        data object Asking : NotificationAsk

        data object Denied : NotificationAsk
    }
}
