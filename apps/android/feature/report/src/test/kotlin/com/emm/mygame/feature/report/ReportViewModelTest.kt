package com.emm.mygame.feature.report

import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
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
    fun `reads again a minute after a failed first read`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        reportViewModelOf(reports)
        runCurrent()

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `draws the report once a retried first read answers`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 1)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(1, contentOf(viewModel).dueCount)
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
    fun `keeps the failure drawn while the read on return waits`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(ReportUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads again on return to a failed first read`() = runTest {
        reports.answerRead(ReportReadResult.Unreachable)
        val viewModel: ReportViewModel = reportViewModelOf(reports)
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)

        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    private companion object {
        const val READS_AVAILABLE: Int = 5
    }
}
