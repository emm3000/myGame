package com.emm.mygame.feature.account.settings

import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.theme.ThemeSettings
import kotlinx.coroutines.flow.StateFlow

data class SettingsSources(
    val sessions: SessionRepository,
    val playerScaffold: StateFlow<PlayerScaffold?>,
    val reminders: StudyReminderSettings,
    val notifications: ReminderNotifications,
    val reports: ReportRepository,
    val themes: ThemeSettings,
)
