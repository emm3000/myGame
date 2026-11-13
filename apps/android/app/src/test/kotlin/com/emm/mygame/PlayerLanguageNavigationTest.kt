package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerChromePhase
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class PlayerLanguageNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val latestRead: MutableStateFlow<PlayerLanguage?> = MutableStateFlow(null)

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = latestRead
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = FakeTownRepository()
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = FakePlacementRepository()
    }

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private fun showReport(language: PlayerLanguage) {
        latestRead.value = language
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                )
            }
        }
        waitForLine("Sign out", "Salir")
    }

    private fun showSignIn() {
        sessionsFake.answerRestore(RestoreResult.SignedOut)
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies)
            }
        }
    }

    private fun waitForLine(vararg lines: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            lines.any { line: String -> composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
        }
    }

    private fun countOf(line: String): Int = composeRule.onAllNodesWithText(line).fetchSemanticsNodes().size

    @Test
    fun `draws the Report in Spanish on an English phone in the Spanish phase`() {
        showReport(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onAllNodesWithText("Informe").assertCountEquals(1)
        composeRule.onAllNodesWithText("Report").assertCountEquals(0)
        composeRule.onAllNodesWithText("PUEBLO").assertCountEquals(1)
    }

    @Test
    fun `draws a screen the chrome has not reached in the scaffold language on an English phone`() {
        sessionsFake.answerRestore(RestoreResult.SignedIn(SignedInPlayer("ines@example.com", isEmailVerified = false)))

        showReport(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.English))

        waitForLine("Confirma tu correo")
        composeRule.onAllNodesWithText("Confirm your email").assertCountEquals(0)
    }

    @Test
    fun `draws the phase of the latest read over the one before it`() {
        showReport(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        latestRead.value = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both)
        waitForLine("Report")

        composeRule.onAllNodesWithText("Report").assertCountEquals(1)
        composeRule.onAllNodesWithText("Informe").assertCountEquals(1)
        latestRead.value = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.English)
        composeRule.waitUntil(WAIT_MILLIS) { countOf("Informe") == 0 }
        composeRule.onAllNodesWithText("Report").assertCountEquals(1)
        composeRule.onAllNodesWithText("TOWN").assertCountEquals(1)
    }

    @Test
    fun `keeps sign-out in Spanish for an es player in the English phase`() {
        showReport(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.English))

        composeRule.onAllNodesWithText("Salir").assertCountEquals(1)
        composeRule.onAllNodesWithText("Sign out").assertCountEquals(0)
    }

    @Test
    fun `keeps the Report in the player's language while it signs out`() {
        showReport(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        latestRead.value = null
        composeRule.waitForIdle()

        composeRule.onAllNodesWithText("Informe").assertCountEquals(1)
        composeRule.onAllNodesWithText("Report").assertCountEquals(0)
    }

    @Test
    fun `keeps every link open after a sign-out that forgets the player's language`() {
        showReport(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        latestRead.value = null
        sessionsFake.answerSignOut()
        repeat(SIGNED_OUT_READS) { sessionsFake.answerRestore(RestoreResult.SignedOut) }
        waitForLine("Sign in to your town")
        composeRule.onNodeWithText("Create your account").performScrollTo().performClick()
        waitForLine("Create account")
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Sign in").performScrollTo().performClick()

        waitForLine("Sign in to your town")
    }

    @Test
    fun `draws the sign-in in the phone's English whatever the last player read`() {
        latestRead.value = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold)

        showSignIn()

        waitForLine("Sign in to your town")
    }

    @Test
    @Config(qualifiers = "es")
    fun `draws the sign-in in the phone's Spanish`() {
        showSignIn()

        waitForLine("Entra en tu pueblo")
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SIGNED_OUT_READS: Int = 3
    }
}
