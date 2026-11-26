package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

class TodayAwayViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    @Test
    fun `a read that answers away draws what the town gained`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = studyFirst, away = TownSnapshot.Away(gains)))

        assertEquals(gains, contentOf(viewModel).gained)
    }

    @Test
    fun `a read that answers no away draws no gains`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = studyFirst, away = null))

        assertEquals(emptyList<TownSnapshot.Cost>(), contentOf(viewModel).gained)
    }

    @Test
    fun `keeps the gains while a later read on Today answers no away`() = runTest {
        val farmWork: TownSnapshot.WorkItem = farmWorkLasting(1.minutes)
        val viewModel: TodayViewModel =
            shownOn(newTown(nextStep = studyFirst, work = farmWork, away = TownSnapshot.Away(gains)))
        towns.answerRead(TownReadResult.Read(newTown(nextStep = studyFirst, away = null)))

        advanceTimeBy(61.seconds)
        runCurrent()

        assertEquals(gains, contentOf(viewModel).gained)
    }

    @Test
    fun `drops the gains once the player leaves Today`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = studyFirst, away = TownSnapshot.Away(gains)))
        towns.answerRead(TownReadResult.Read(newTown(nextStep = studyFirst, away = null)))
        reports.answerRead(ReportReadResult.Read(noNews))

        viewModel.onIntent(TodayIntent.ScreenHidden)
        viewModel.onIntent(TodayIntent.ScreenLeft)
        viewModel.onIntent(TodayIntent.ScreenShown)
        runCurrent()

        assertEquals(emptyList<TownSnapshot.Cost>(), contentOf(viewModel).gained)
    }

    @Test
    fun `keeps the gains while Today stops and starts again with no navigation between`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = studyFirst, away = TownSnapshot.Away(gains)))
        towns.answerRead(TownReadResult.Read(newTown(nextStep = studyFirst, away = null)))
        reports.answerRead(ReportReadResult.Read(noNews))

        viewModel.onIntent(TodayIntent.ScreenHidden)
        viewModel.onIntent(TodayIntent.ScreenShown)
        runCurrent()

        assertEquals(gains, contentOf(viewModel).gained)
    }

    private fun TestScope.shownOn(town: TownSnapshot): TodayViewModel {
        towns.answerRead(TownReadResult.Read(town))
        reports.answerRead(ReportReadResult.Read(noNews))
        val viewModel: TodayViewModel = TodayViewModel(towns, reports, TestClock(testScheduler, readAt))
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.onIntent(TodayIntent.ScreenHidden)
            }
        }
        viewModel.onIntent(TodayIntent.ScreenShown)
        runCurrent()
        return viewModel
    }

    private fun contentOf(viewModel: TodayViewModel): TodayUiState.Content =
        viewModel.state.value as TodayUiState.Content

    private companion object {
        val studyFirst: NextStep = NextStep.LessonToStudy(LessonId("lesson-1"))
        val gains: List<TownSnapshot.Cost> = listOf(
            TownSnapshot.Cost(TownResourceKind.Money, 120),
            TownSnapshot.Cost(TownResourceKind.Food, 45),
        )
        val noNews: TownReport =
            TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList(), readAt = readAt)
    }
}
