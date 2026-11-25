package com.emm.mygame.feature.report

import app.cash.turbine.test
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReportSignOutViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private fun TestScope.signedInReport(report: TownReport = reportOf(dueCount = 1)): ReportViewModel {
        val viewModel: ReportViewModel = reportViewModelOf(reports, sessions)
        reports.answerRead(ReportReadResult.Read(report))
        runCurrent()
        return viewModel
    }

    @Test
    fun `tells the route once that it is signing out while the session ends`() = runTest {
        val viewModel: ReportViewModel = signedInReport()

        viewModel.effects.test {
            viewModel.onIntent(ReportIntent.SignOutTapped)

            assertEquals(ReportEffect.SigningOut, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `tells the route it is signing out once however often sign-out is tapped`() = runTest {
        val viewModel: ReportViewModel = signedInReport()

        viewModel.effects.test {
            viewModel.onIntent(ReportIntent.SignOutTapped)
            viewModel.onIntent(ReportIntent.SignOutTapped)
            runCurrent()

            assertEquals(ReportEffect.SigningOut, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `signs out and tells the route`() = runTest {
        val viewModel: ReportViewModel = signedInReport()
        sessions.answerSignOut()

        viewModel.effects.test {
            viewModel.onIntent(ReportIntent.SignOutTapped)

            assertEquals(ReportEffect.SigningOut, awaitItem())
            assertEquals(ReportEffect.SignedOut, awaitItem())
        }
    }

    @Test
    fun `draws signing out while the session ends`() = runTest {
        val viewModel: ReportViewModel = signedInReport()

        viewModel.onIntent(ReportIntent.SignOutTapped)

        assertEquals(ReportUiState.SigningOut, viewModel.state.value)
    }

    @Test
    fun `ignores every tap while signing out`() = runTest {
        val viewModel: ReportViewModel = signedInReport(newsToClose)
        viewModel.onIntent(ReportIntent.SignOutTapped)

        viewModel.onIntent(ReportIntent.CloseTapped)
        runCurrent()

        assertEquals(0, reports.closeCount)
    }

    @Test
    fun `keeps signing out when a read lands late`() = runTest {
        val viewModel: ReportViewModel = reportViewModelOf(reports, sessions)
        viewModel.onIntent(ReportIntent.SignOutTapped)

        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 3)))
        runCurrent()

        assertEquals(ReportUiState.SigningOut, viewModel.state.value)
    }
}
