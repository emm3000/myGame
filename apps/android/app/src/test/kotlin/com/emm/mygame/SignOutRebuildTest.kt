package com.emm.mygame

import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class SignOutRebuildTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = dependenciesOf(sessions = sessions, reports = reports)

    @After
    fun forgetTheHostContent() {
        RebuildHostActivity.shown = null
    }

    private fun signingOutOnARecreatedReport() {
        reports.answerRead(
            ReportReadResult.Read(
                TownReport(
                    dueCount = 0,
                    readFirst = emptyList(),
                    nextDueAt = null,
                    news = emptyList(),
                    readAt = Instant.parse("2026-11-05T10:00:00Z"),
                ),
            ),
        )
        RebuildHostActivity.shown =
            RebuildHostActivity.Shown(dependencies, listOf(Destination.Today, Destination.Town, Destination.Report))
        val host: ActivityController<RebuildHostActivity> =
            Robolectric.buildActivity(RebuildHostActivity::class.java).setup()
        waitForLine("Salir")
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        composeRule.runOnIdle { host.recreate() }
        composeRule.waitForIdle()
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun `opens the links for the next session once a sign-out survives a recreation`() {
        signingOutOnARecreatedReport()

        repeat(SIGNED_OUT_READS) { sessions.answerRestore(RestoreResult.SignedOut) }
        sessions.answerSignOut()
        waitForLine("Entra en tu pueblo")
        composeRule.onNodeWithText("Crea tu cuenta").performScrollTo().performClick()
        waitForLine("¿Ya tienes cuenta?")
        composeRule.onNodeWithText("Entra").performScrollTo().performClick()

        waitForLine("¿Aún no tienes cuenta?")
    }

    @Test
    fun `keeps the header's town link shut when the activity is recreated mid-sign-out`() {
        signingOutOnARecreatedReport()
        waitForLine("Pueblo")

        composeRule.onNode(hasText("Pueblo").and(hasClickAction())).performClick()
        composeRule.waitForIdle()

        composeRule.onNode(hasText("Informe").and(isHeading())).assertExists()
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SIGNED_OUT_READS: Int = 3
    }
}
