package com.emm.mygame.feature.account

import com.emm.mygame.core.model.reminder.StudyReminderChoice

internal val firstReminder: SettingsUiState.Reminder = SettingsUiState.Reminder(
    isOn = StudyReminderChoice.firstChoice.isOn,
    time = StudyReminderChoice.firstChoice.time,
    ask = SettingsUiState.NotificationAsk.Untouched,
)
