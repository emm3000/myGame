package com.emm.mygame

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
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.model.town.jobs.TownRegionRepository
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
import org.koin.core.module.Module
import org.koin.dsl.binds
import org.koin.dsl.module

fun fakePortBindings(
    clock: Clock = Clock.System,
    sessionEnds: SessionEnds = SessionEnds(),
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
): Module = module {
    single<Clock> { clock }
    single { sessionEnds }
    single { sessions }
    single { towns } binds arrayOf(TownReader::class, TownRegionRepository::class)
    single { texts }
    single { keepGoing }
    single { learning }
    single { reports }
    single { placements }
    single { holdoutChecks }
    single { studyReminders }
    single { reminderNotifications }
    single { themes }
}
