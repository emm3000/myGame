package com.emm.mygame.feature.signin

import java.time.LocalTime

internal val firstReminder: SettingsUiState.Reminder =
    SettingsUiState.Reminder(isOn = false, time = LocalTime.of(19, 0), ask = SettingsUiState.NotificationAsk.Untouched)

internal class FakeReminderNotifications(override var areAllowed: Boolean, override val canAsk: Boolean) :
    ReminderNotifications
