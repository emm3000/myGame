package com.emm.mygame.feature.report

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.testing.FakeReportRepository
import kotlin.time.Clock
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

    private val screenOwner: ScreenOwner = ScreenOwner()

    private fun showRoute() {
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides screenOwner) {
                MyGameTheme {
                    ReportRoute(reports = reports, clock = Clock.System, onReviewsOpen = {})
                }
            }
        }
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        composeRule.waitForIdle()
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
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
