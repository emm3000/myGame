package com.emm.mygame

import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController

@RunWith(RobolectricTestRunner::class)
class SignOutRebuildTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = FakeTownRepository()
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
    }

    @After
    fun forgetTheHostContent() {
        RebuildHostActivity.shown = null
    }

    private fun signingOutOnARecreatedReport() {
        reportsFake.answerRead(
            ReportReadResult.Read(
                TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList()),
            ),
        )
        RebuildHostActivity.shown =
            RebuildHostActivity.Shown(dependencies, listOf(Destination.Town, Destination.Report))
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
    fun `keeps the back link disabled when the activity is recreated mid-sign-out`() {
        signingOutOnARecreatedReport()

        composeRule.onNodeWithText("PUEBLO").assertIsNotEnabled()
    }

    @Test
    fun `opens the links for the next session once a sign-out survives a recreation`() {
        signingOutOnARecreatedReport()

        repeat(SIGNED_OUT_READS) { sessionsFake.answerRestore(RestoreResult.SignedOut) }
        sessionsFake.answerSignOut()
        waitForLine("Entra en tu pueblo")
        composeRule.onNodeWithText("Crea tu cuenta").performScrollTo().performClick()
        waitForLine("¿Ya tienes cuenta?")
        composeRule.onNodeWithText("Entra").performScrollTo().performClick()

        waitForLine("¿Aún no tienes cuenta?")
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SIGNED_OUT_READS: Int = 3
    }
}
