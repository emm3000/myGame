package com.emm.mygame

import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.model.theme.ThemeSettings
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownTextRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.StateFlow

interface AppDependencies {

    val clock: Clock

    val sessionEnds: SessionEnds

    val playerLanguage: StateFlow<PlayerLanguage?>

    val playerScaffold: StateFlow<PlayerScaffold?>

    val sessions: SessionRepository

    val towns: TownRepository

    val texts: TownTextRepository

    val learning: LearningRepository

    val reports: ReportRepository

    val placements: PlacementRepository

    val holdoutChecks: HoldoutCheckRepository

    val studyReminders: StudyReminderSettings

    val reminderNotifications: ReminderNotifications

    val themes: ThemeSettings
}
