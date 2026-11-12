package com.emm.mygame.feature.report

import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownNewsReadResult
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration.Companion.hours
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class NewsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val reports: FakeReportRepository = FakeReportRepository()

    private fun TestScope.newsViewModel(): NewsViewModel = NewsViewModel(reports, TestClock(testScheduler, readInstant))

    private fun TestScope.newsReading(answer: TownNewsReadResult): NewsViewModel {
        reports.answerNews(answer)
        val viewModel: NewsViewModel = newsViewModel()
        runCurrent()
        return viewModel
    }

    @Test
    fun `draws loading while the news reads`() = runTest {
        val viewModel: NewsViewModel = newsViewModel()

        assertEquals(NewsUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `lists the newest first, in the order the api answers`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Read(listOf(stoppedLesson, finishedFarm)))

        assertEquals(NewsUiState.Content(listOf(stoppedLesson, finishedFarm), readInstant), viewModel.state.value)
    }

    @Test
    fun `draws the news exactly as the server sends them, never sorted by time`() = runTest {
        val older: TownNews = TownNews.LessonStudied(readInstant - 2.hours)
        val newer: TownNews = TownNews.BecameCity(readInstant - 1.hours)
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Read(listOf(older, newer)))

        assertEquals(NewsUiState.Content(listOf(older, newer), readInstant), viewModel.state.value)
    }

    @Test
    fun `draws no news when the town has none`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Read(emptyList()))

        assertEquals(NewsUiState.Content(emptyList<TownNews>(), readInstant), viewModel.state.value)
    }

    @Test
    fun `draws a failed read`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Unreachable)

        assertEquals(NewsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the news again on a retry after a failed read`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Unreachable)
        reports.answerNews(TownNewsReadResult.Read(listOf(finishedFarm)))

        viewModel.onIntent(NewsIntent.RetryTapped)
        runCurrent()

        assertEquals(NewsUiState.Content(listOf(finishedFarm), readInstant), viewModel.state.value)
    }

    @Test
    fun `draws loading again while a retry reads`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Unreachable)

        viewModel.onIntent(NewsIntent.RetryTapped)

        assertEquals(NewsUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `reads once on a double retry after a failed read`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Unreachable)

        viewModel.onIntent(NewsIntent.RetryTapped)
        viewModel.onIntent(NewsIntent.RetryTapped)
        runCurrent()

        assertEquals(2, reports.newsReadCount)
    }

    @Test
    fun `reads nothing on a retry while the news is shown`() = runTest {
        val viewModel: NewsViewModel = newsReading(TownNewsReadResult.Read(listOf(finishedFarm)))

        viewModel.onIntent(NewsIntent.RetryTapped)
        runCurrent()

        assertEquals(1, reports.newsReadCount)
    }
}
