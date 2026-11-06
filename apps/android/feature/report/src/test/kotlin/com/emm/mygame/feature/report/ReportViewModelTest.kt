package com.emm.mygame.feature.report

import app.cash.turbine.test
import com.emm.mygame.core.network.ReportCloseResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReportViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val newsToClose: TownReport = reportOf(dueCount = 2, news = listOf(finishedFarm))

    private fun TestScope.reportReading(report: TownReport): ReportViewModel = reportReadingFrom(reports, report)

    @Test
    fun `draws loading until the report answers`() = runTest {
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()

        assertEquals(ReportUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the count of reviews due`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(dueCount = 3))

        assertEquals(3, contentOf(viewModel).dueCount)
    }

    @Test
    fun `points at the first lesson to read first`() = runTest {
        val viewModel: ReportViewModel =
            reportReading(reportOf(readFirst = listOf(unreadLesson, laterUnreadLesson)))

        assertEquals(unreadLesson, contentOf(viewModel).firstUnread)
    }

    @Test
    fun `points at no lesson when nothing is left to read first`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(dueCount = 3))

        assertEquals(null, contentOf(viewModel).firstUnread)
    }

    @Test
    fun `draws the news the report answers`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(news = listOf(finishedFarm, stoppedLesson)))

        assertEquals(listOf(finishedFarm, stoppedLesson), unreadOf(viewModel).items)
    }

    @Test
    fun `draws no news when the report holds none`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())

        assertEquals(ReportUiState.ReportNews.None, contentOf(viewModel).news)
    }

    @Test
    fun `keeps the instant of the read`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())

        assertEquals(readInstant, contentOf(viewModel).receivedAt)
    }

    @Test
    fun `draws the failure when the first read cannot reach the api`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()

        assertEquals(ReportUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads again from the failure on a retry`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 1)))

        viewModel.onIntent(ReportIntent.RetryTapped)
        runCurrent()

        assertEquals(1, contentOf(viewModel).dueCount)
    }

    @Test
    fun `draws loading while a retry waits`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()

        viewModel.onIntent(ReportIntent.RetryTapped)
        runCurrent()

        assertEquals(ReportUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `reads once on a double tap of the retry`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()

        viewModel.onIntent(ReportIntent.RetryTapped)
        viewModel.onIntent(ReportIntent.RetryTapped)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `ignores a retry while the content is drawn`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())

        viewModel.onIntent(ReportIntent.RetryTapped)
        runCurrent()

        assertEquals(1, reports.readCount)
    }

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
    fun `reads nothing more on the first shown intent`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(1, reports.readCount)
    }

    @Test
    fun `reads the report again on return`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(dueCount = 4))
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 1)))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(1, contentOf(viewModel).dueCount)
    }

    @Test
    fun `keeps the content drawn while a return reads`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(dueCount = 4))
        viewModel.onIntent(ReportIntent.ScreenHidden)

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(4, contentOf(viewModel).dueCount)
    }

    @Test
    fun `moves the instant of the read on a return`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())
        viewModel.onIntent(ReportIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        reports.answerRead(ReportReadResult.Read(reportOf()))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(readInstant + 5.minutes, contentOf(viewModel).receivedAt)
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
    fun `keeps the content when a return cannot reach the api`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(dueCount = 4))
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Unreachable)

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(4, contentOf(viewModel).dueCount)
    }

    @Test
    fun `waits a full minute before reading again after a failed return`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Unreachable)
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        advanceTimeBy(59.seconds)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `reads again a minute after a failed return`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Unreachable)
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 6)))
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(6, contentOf(viewModel).dueCount)
    }

    @Test
    fun `keeps the fixed minute across failed reads`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())
        viewModel.onIntent(ReportIntent.ScreenHidden)
        repeat(3) { reports.answerRead(ReportReadResult.Unreachable) }
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        advanceTimeBy(2.minutes)
        runCurrent()

        assertEquals(4, reports.readCount)
    }

    @Test
    fun `stops the retry on background`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf())
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Unreachable)
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        viewModel.onIntent(ReportIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `reads again from loading when the first read was hidden`() = runTest {
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 2)))

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(2, contentOf(viewModel).dueCount)
    }

    @Test
    fun `keeps the failure on return until a retry`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(ReportUiState.Failed, viewModel.state.value)
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
