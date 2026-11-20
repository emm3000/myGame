package com.emm.mygame

import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.ThemeSettings
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeThemeSettings
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

fun dependenciesOf(
    clock: Clock = Clock.System,
    playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null),
    playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null),
    sessions: SessionRepository = FakeSessionRepository(),
    towns: TownRepository = FakeTownRepository(),
    learning: LearningRepository = FakeLearningRepository(),
    reports: ReportRepository = FakeReportRepository(),
    placements: PlacementRepository = FakePlacementRepository(),
    holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository(),
    studyReminders: StudyReminderSettings = FakeStudyReminderSettings(StudyReminderChoice.firstChoice),
    reminderNotifications: ReminderNotifications = FakeReminderNotifications(areAllowed = true, canAsk = true),
    themes: ThemeSettings = FakeThemeSettings(ThemePick.System),
): AppDependencies = object : AppDependencies {
    override val clock: Clock = clock
    override val sessionEnds: SessionEnds = SessionEnds()
    override val playerLanguage: StateFlow<PlayerLanguage?> = playerLanguage
    override val playerScaffold: StateFlow<PlayerScaffold?> = playerScaffold
    override val sessions: SessionRepository = sessions
    override val towns: TownRepository = towns
    override val learning: LearningRepository = learning
    override val reports: ReportRepository = reports
    override val placements: PlacementRepository = placements
    override val holdoutChecks: HoldoutCheckRepository = holdoutChecks
    override val studyReminders: StudyReminderSettings = studyReminders
    override val reminderNotifications: ReminderNotifications = reminderNotifications
    override val themes: ThemeSettings = themes
}
