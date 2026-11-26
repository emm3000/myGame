package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.report.ReportCloseResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.testing.FakeKeepGoingRepository
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
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

class TodayNewsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    @Test
    fun `What happened draws the three newest events not yet closed`() = runTest {
        val viewModel: TodayViewModel = shownWith(listOf(farmBuilt, jobBack, hired, lessonStudied, becameCity))

        assertEquals(listOf(farmBuilt, jobBack, hired), whatHappenedOf(viewModel)?.events?.map { it.news })
    }

    @Test
    fun `What happened draws nothing while every event is closed`() = runTest {
        val viewModel: TodayViewModel = shownWith(emptyList())

        assertNull(whatHappenedOf(viewModel))
    }

    @Test
    fun `a building built, a lesson studied, a skill earned and a city are achievements`() {
        val achievements: List<TownNews> = listOf(farmBuilt, lessonStudied, skillEarned, becameCity)

        assertEquals(
            achievements.map { news: TownNews -> TodayUiState.NewsEvent.Achievement(news) },
            achievements.map(::newsEventOf),
        )
    }

    @Test
    fun `every other event is a plain row`() {
        val others: List<TownNews> = listOf(
            jobBack,
            hired,
            TownNews.BuildingWorkStopped(at, TownBuildingKind.Farm, level = 2, refund = emptyList()),
            TownNews.LessonStopped(at),
            TownNews.HiringStopped(at, TownHireKind.Truck, delivered = 1, stopped = 1, refund = emptyList()),
            TownNews.JobCalledBack(at, site, pay = emptyList()),
            TownNews.CleanUpDone(at, site, reward = emptyList()),
            TownNews.CleanUpFailed(at, site),
        )

        assertEquals(others.map { news: TownNews -> TodayUiState.NewsEvent.Plain(news) }, others.map(::newsEventOf))
    }

    @Test
    fun `Close sends the close of the news`() = runTest {
        val viewModel: TodayViewModel = shownWith(listOf(farmBuilt))

        viewModel.onIntent(TodayIntent.NewsCloseTapped)
        runCurrent()

        assertEquals(1, reports.closeCount)
    }

    @Test
    fun `What happened goes once the news is closed`() = runTest {
        val viewModel: TodayViewModel = shownWith(listOf(farmBuilt))
        reports.answerClose(ReportCloseResult.Closed)

        viewModel.onIntent(TodayIntent.NewsCloseTapped)
        runCurrent()

        assertNull(whatHappenedOf(viewModel))
    }

    @Test
    fun `Close waits for the server's answer`() = runTest {
        val viewModel: TodayViewModel = shownWith(listOf(farmBuilt))

        viewModel.onIntent(TodayIntent.NewsCloseTapped)
        runCurrent()

        assertEquals(TodayUiState.NewsClose.Waiting, whatHappenedOf(viewModel)?.close)
    }

    @Test
    fun `a close the server never heard keeps the events beside its refusal`() = runTest {
        val viewModel: TodayViewModel = shownWith(listOf(farmBuilt))
        reports.answerClose(ReportCloseResult.Unreachable)

        viewModel.onIntent(TodayIntent.NewsCloseTapped)
        runCurrent()

        assertEquals(
            TodayUiState.WhatHappened(listOf(TodayUiState.NewsEvent.Achievement(farmBuilt)), readAt, unreachable),
            whatHappenedOf(viewModel),
        )
    }

    @Test
    fun `a finished countdown reads the news again`() = runTest {
        val running: TownSnapshot =
            newTown(nextStep = NextStep.LessonToStudy(firstLesson), work = farmWorkLasting(1.minutes))
        val viewModel: TodayViewModel = shownWith(emptyList(), town = running)
        towns.answerRead(TownReadResult.Read(newTown(nextStep = NextStep.LessonToStudy(firstLesson))))
        reports.answerRead(ReportReadResult.Read(reportOf(listOf(farmBuilt))))

        advanceTimeBy(61.seconds)
        runCurrent()

        assertEquals(listOf(farmBuilt), whatHappenedOf(viewModel)?.events?.map { it.news })
    }

    private fun TestScope.shownWith(
        news: List<TownNews>,
        town: TownSnapshot = newTown(nextStep = NextStep.LessonToStudy(firstLesson)),
    ): TodayViewModel {
        towns.answerRead(TownReadResult.Read(town))
        reports.answerRead(ReportReadResult.Read(reportOf(news)))
        val viewModel: TodayViewModel =
            TodayViewModel(towns, reports, FakeKeepGoingRepository(), TestClock(testScheduler, readAt))
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

    private fun whatHappenedOf(viewModel: TodayViewModel): TodayUiState.WhatHappened? =
        (viewModel.state.value as TodayUiState.Content).whatHappened

    private fun reportOf(news: List<TownNews>): TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = news, readAt = readAt)

    private companion object {
        val firstLesson: LessonId = LessonId("lesson-1")
        val at: Instant = readAt - 20.minutes
        val site: TownSite = TownSite(region = 1, area = 2, site = 3)
        val unreachable: TodayUiState.NewsClose = TodayUiState.NewsClose.Unreachable
        val farmBuilt: TownNews = TownNews.BuildingWorkFinished(at, TownBuildingKind.Farm, level = 2)
        val jobBack: TownNews = TownNews.JobBack(at, site, pay = emptyList())
        val hired: TownNews = TownNews.HiringDelivered(at, TownHireKind.Worker, count = 2)
        val lessonStudied: TownNews = TownNews.LessonStudied(at)
        val skillEarned: TownNews = TownNews.SkillEarned(at, TownResourceKind.Food, ratePercent = 5)
        val becameCity: TownNews = TownNews.BecameCity(at)
    }
}
