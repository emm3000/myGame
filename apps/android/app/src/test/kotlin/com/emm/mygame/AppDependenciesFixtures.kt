package com.emm.mygame

import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.core.model.theme.ThemeSettings
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeKeepGoingRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeThemeSettings
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.FakeTownTextRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

fun dependenciesOf(
    clock: Clock = Clock.System,
    playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null),
    playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null),
    sessions: SessionRepository = FakeSessionRepository(),
    towns: TownRepository = FakeTownRepository(),
    texts: TownTextRepository = FakeTownTextRepository(),
    keepGoing: KeepGoingRepository = FakeKeepGoingRepository(),
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
    override val texts: TownTextRepository = texts
    override val keepGoing: KeepGoingRepository = keepGoing
    override val learning: LearningRepository = learning
    override val reports: ReportRepository = reports
    override val placements: PlacementRepository = placements
    override val holdoutChecks: HoldoutCheckRepository = holdoutChecks
    override val studyReminders: StudyReminderSettings = studyReminders
    override val reminderNotifications: ReminderNotifications = reminderNotifications
    override val themes: ThemeSettings = themes
}
