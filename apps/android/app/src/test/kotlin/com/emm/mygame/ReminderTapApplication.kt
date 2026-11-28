package com.emm.mygame

import android.app.Application
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.model.theme.ThemePick
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
import org.koin.core.KoinApplication

class ReminderTapApplication : Application(), AppGraph, AppDependencies {

    override val clock: Clock = Clock.System

    override val sessionEnds: SessionEnds = SessionEnds()

    override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)

    override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)

    override val sessions: FakeSessionRepository = FakeSessionRepository()

    override val towns: FakeTownRepository = FakeTownRepository()

    override val texts: TownTextRepository = FakeTownTextRepository()

    override val keepGoing: KeepGoingRepository = FakeKeepGoingRepository()

    override val learning: LearningRepository = FakeLearningRepository()

    override val reports: FakeReportRepository = FakeReportRepository()

    override val placements: PlacementRepository = FakePlacementRepository()

    override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()

    override val studyReminders: StudyReminderSettings =
        FakeStudyReminderSettings(StudyReminderChoice.firstChoice)

    override val reminderNotifications: ReminderNotifications =
        FakeReminderNotifications(areAllowed = true, canAsk = true)

    override val themes: FakeThemeSettings = FakeThemeSettings(ThemePick.System)

    override val graph: KoinApplication = fakeGraphOf(
        fakePortBindings(
            clock = clock,
            sessionEnds = sessionEnds,
            sessions = sessions,
            towns = towns,
            texts = texts,
            keepGoing = keepGoing,
            learning = learning,
            reports = reports,
            placements = placements,
            holdoutChecks = holdoutChecks,
            studyReminders = studyReminders,
            reminderNotifications = reminderNotifications,
            themes = themes,
        ),
    )
}
