package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.StudyReminderChoice

internal val firstReminder: SettingsUiState.Reminder = SettingsUiState.Reminder(
    isOn = StudyReminderChoice.firstChoice.isOn,
    time = StudyReminderChoice.firstChoice.time,
    ask = SettingsUiState.NotificationAsk.Untouched,
)

internal class FakeReminderNotifications(override var areAllowed: Boolean, override val canAsk: Boolean) :
    ReminderNotifications
