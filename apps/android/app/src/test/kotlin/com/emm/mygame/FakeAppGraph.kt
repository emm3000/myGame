package com.emm.mygame

import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.theme.ThemeSettings
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.navigation.screenBindings
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.koin.core.KoinApplication
import org.koin.core.module.Module
import org.koin.dsl.koinApplication

class FakeAppGraph(
    ports: Module = fakePortBindings(),
    override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null),
    override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null),
) : AppGraph, AppDependencies {

    override val graph: KoinApplication = fakeGraphOf(ports)

    override val clock: Clock get() = graph.koin.get()

    override val sessionEnds: SessionEnds get() = graph.koin.get()

    override val sessions: SessionRepository get() = graph.koin.get()

    override val towns: TownRepository get() = graph.koin.get()

    override val texts: TownTextRepository get() = graph.koin.get()

    override val keepGoing: KeepGoingRepository get() = graph.koin.get()

    override val learning: LearningRepository get() = graph.koin.get()

    override val reports: ReportRepository get() = graph.koin.get()

    override val placements: PlacementRepository get() = graph.koin.get()

    override val holdoutChecks: HoldoutCheckRepository get() = graph.koin.get()

    override val studyReminders: StudyReminderSettings get() = graph.koin.get()

    override val reminderNotifications: ReminderNotifications get() = graph.koin.get()

    override val themes: ThemeSettings get() = graph.koin.get()
}

fun fakeGraphOf(ports: Module): KoinApplication = koinApplication {
    allowOverride(false)
    modules(screenBindings, ports)
}
