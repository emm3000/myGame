package com.emm.mygame.feature.report

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import kotlin.time.Clock
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReportRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val screenOwner: ScreenOwner = ScreenOwner()

    private val frozenClock: Clock = object : Clock {
        override fun now(): Instant = readInstant
    }

    private var signingOuts: Int = 0

    private fun routeShowing(viewModel: ReportViewModel): @Composable () -> Unit = {
        CompositionLocalProvider(LocalLifecycleOwner provides screenOwner) {
            MyGameTheme {
                ReportRoute(
                    reports = reports,
                    sessions = sessions,
                    clock = frozenClock,
                    navigation = ReportNavigation(
                        onReviewsOpen = {},
                        onLessonOpen = {},
                        onNewsOpen = {},
                        onSettingsOpen = {},
                        onSigningOut = { signingOuts += 1 },
                        onSignedOut = {},
                    ),
                    viewModel = viewModel,
                )
            }
        }
    }

    private fun showRoute() {
        composeRule.setContent(routeShowing(ReportViewModel(reports, sessions, Clock.System)))
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        composeRule.waitForIdle()
    }

    private fun showRebuildableRoute(): StateRestorationTester {
        val restoration: StateRestorationTester = StateRestorationTester(composeRule)
        restoration.setContent(routeShowing(ReportViewModel(reports, sessions, frozenClock)))
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        return restoration
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
    }

    @Test
    fun `calls onSigningOut once when the screen is rebuilt mid-sign-out`() {
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 0)))
        val restoration: StateRestorationTester = showRebuildableRoute()
        waitForLine("Salir")
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        restoration.emulateSavedInstanceStateRestore()
        composeRule.waitForIdle()

        assertEquals(1, signingOuts)
    }

    @Test
    fun `reads the report once on return from the background`() {
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 4)))
        showRoute()
        waitForLine("Repasos pendientes: 4")
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.CREATED) }
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 1)))

        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        waitForLine("Repasos pendientes: 1")

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `reads nothing while the app stays in the foreground`() {
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 4)))
        showRoute()
        waitForLine("Repasos pendientes: 4")

        composeRule.waitForIdle()

        assertEquals(1, reports.readCount)
    }

    private class ScreenOwner : LifecycleOwner {

        private val registry: LifecycleRegistry = LifecycleRegistry.createUnsafe(this)

        override val lifecycle: Lifecycle
            get() = registry

        fun move(state: Lifecycle.State) {
            registry.currentState = state
        }
    }
}
