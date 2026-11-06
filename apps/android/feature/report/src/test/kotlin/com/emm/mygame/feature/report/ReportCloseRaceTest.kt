package com.emm.mygame.feature.report

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ReportCloseResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReportCloseRaceTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val reports: ReportsAnsweredInAnyOrder = ReportsAnsweredInAnyOrder()

    @Test
    fun `drops a read asked before the close answered`() = runTest {
        val viewModel: ReportViewModel = viewModelWithAReadPending()

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        reports.reads[1].complete(ReportReadResult.Read(reportOf(news = listOf(finishedFarm))))
        runCurrent()

        assertEquals(ReportUiState.ReportNews.Closed, contentOf(viewModel).news)
    }

    @Test
    fun `draws the read asked after the close`() = runTest {
        val viewModel: ReportViewModel = viewModelWithAReadPending()

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()
        reports.reads[2].complete(ReportReadResult.Read(reportOf(dueCount = 2)))
        runCurrent()

        assertEquals(2, contentOf(viewModel).dueCount)
    }

    private fun TestScope.viewModelWithAReadPending(): ReportViewModel {
        val clock: TestClock = TestClock(testScheduler, readInstant)
        val viewModel: ReportViewModel = ReportViewModel(reports, FakeSessionRepository(), clock)
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.viewModelScope.cancel()
            }
        }
        runCurrent()
        reports.reads[0].complete(ReportReadResult.Read(reportOf(dueCount = 4, news = listOf(finishedFarm))))
        runCurrent()
        viewModel.onIntent(ReportIntent.ScreenHidden)
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()
        return viewModel
    }

    private class ReportsAnsweredInAnyOrder : ReportRepository {

        val reads: MutableList<CompletableDeferred<ReportReadResult>> = mutableListOf()

        override suspend fun read(): ReportReadResult {
            val pending: CompletableDeferred<ReportReadResult> = CompletableDeferred()
            reads += pending
            return pending.await()
        }

        override suspend fun close(): ReportCloseResult = ReportCloseResult.Closed
    }
}
