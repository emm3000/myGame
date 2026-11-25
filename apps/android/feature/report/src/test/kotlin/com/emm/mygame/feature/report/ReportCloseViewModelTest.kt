package com.emm.mygame.feature.report

import app.cash.turbine.test
import com.emm.mygame.core.model.report.ReportCloseResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReportCloseViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val reports: FakeReportRepository = FakeReportRepository()

    private fun TestScope.reportReading(report: TownReport): ReportViewModel = reportReadingFrom(reports, report)

    @Test
    fun `closes once on a double tap`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)

        viewModel.onIntent(ReportIntent.CloseTapped)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(1, reports.closeCount)
    }

    @Test
    fun `draws the close waiting until the api answers`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(ReportUiState.CloseRequest.Waiting, unreadOf(viewModel).close)
    }

    @Test
    fun `draws the news closed once the api closes them`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Closed)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(ReportUiState.ReportNews.Closed, contentOf(viewModel).news)
    }

    @Test
    fun `keeps the reviews due when the news close`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Closed)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(2, contentOf(viewModel).dueCount)
    }

    @Test
    fun `keeps the news beside the outage when the close cannot reach the api`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Unreachable)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(
            ReportUiState.ReportNews.Unread(listOf(finishedFarm), ReportUiState.CloseRequest.Unreachable),
            contentOf(viewModel).news,
        )
    }

    @Test
    fun `closes again after an outage`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Unreachable)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        reports.answerClose(ReportCloseResult.Closed)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(ReportUiState.ReportNews.Closed, contentOf(viewModel).news)
    }

    @Test
    fun `asks nothing when there are no news to close`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(0, reports.closeCount)
    }

    @Test
    fun `asks nothing while the report loads`() = runTest {
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(0, reports.closeCount)
    }

    @Test
    fun `emits every step of a close in order`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)

        viewModel.state.test {
            awaitItem()
            viewModel.onIntent(ReportIntent.CloseTapped)
            val waiting: ReportUiState.Content = awaitItem() as ReportUiState.Content
            assertEquals(ReportUiState.CloseRequest.Waiting, (waiting.news as ReportUiState.ReportNews.Unread).close)
            reports.answerClose(ReportCloseResult.Closed)
            assertEquals(ReportUiState.ReportNews.Closed, (awaitItem() as ReportUiState.Content).news)
            expectNoEvents()
        }
    }

    @Test
    fun `shows only the news since the last close`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Closed)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Read(reportOf(news = listOf(stoppedLesson))))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(listOf(stoppedLesson), unreadOf(viewModel).items)
    }

    @Test
    fun `keeps the news closed when a return reads nothing new`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Closed)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Read(reportOf()))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(ReportUiState.ReportNews.Closed, contentOf(viewModel).news)
    }

    @Test
    fun `clears the outage of a close on the next read`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Unreachable)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Read(newsToClose))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(ReportUiState.CloseRequest.Idle, unreadOf(viewModel).close)
    }

    @Test
    fun `keeps a close waiting through a read`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        viewModel.onIntent(ReportIntent.ScreenHidden)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        reports.answerRead(ReportReadResult.Read(newsToClose))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(1, reports.closeCount)
    }

    @Test
    fun `reads again when a close drops a pending read`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        viewModel.onIntent(ReportIntent.ScreenHidden)
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()
        viewModel.onIntent(ReportIntent.CloseTapped)
        reports.answerClose(ReportCloseResult.Closed)
        runCurrent()

        assertEquals(3, reports.readCount)
    }

    @Test
    fun `reads nothing more when a close answers with no read pending`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        reports.answerClose(ReportCloseResult.Closed)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(1, reports.readCount)
    }

    @Test
    fun `keeps the close answered while hidden`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)

        reports.answerClose(ReportCloseResult.Closed)
        runCurrent()

        assertEquals(ReportUiState.ReportNews.Closed, contentOf(viewModel).news)
    }

    @Test
    fun `reads nothing while hidden when a close answers`() = runTest {
        val viewModel: ReportViewModel = reportReading(newsToClose)
        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)

        reports.answerClose(ReportCloseResult.Closed)
        runCurrent()

        assertEquals(1, reports.readCount)
    }
}
