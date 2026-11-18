package com.emm.mygame

import android.app.Application
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class ReminderTapApplication : Application(), AppDependencies {

    val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    override val clock: Clock = Clock.System

    override val sessionEnds: SessionEnds = SessionEnds()

    override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)

    override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)

    override val sessions: SessionRepository = sessionsFake

    override val towns: TownRepository = FakeTownRepository()

    override val learning: LearningRepository = FakeLearningRepository()

    override val reports: ReportRepository = FakeReportRepository()

    override val placements: PlacementRepository = FakePlacementRepository()

    override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()

    override val studyReminders: StudyReminderSettings =
        FakeStudyReminderSettings(StudyReminderChoice.firstChoice)
}
