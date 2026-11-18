package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold

sealed interface SettingsIntent {

    data class ScaffoldPicked(val scaffold: PlayerScaffold) : SettingsIntent

    data object RetryTapped : SettingsIntent

    data class ReminderSwitched(val isOn: Boolean) : SettingsIntent

    data class NotificationsAnswered(val isGranted: Boolean) : SettingsIntent

    data class ReminderStepped(val step: ReminderStep) : SettingsIntent
}
