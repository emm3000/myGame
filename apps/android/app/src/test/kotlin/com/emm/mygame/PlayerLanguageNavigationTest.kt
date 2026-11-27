package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignInResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class PlayerLanguageNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val latestRead: MutableStateFlow<PlayerLanguage?> = MutableStateFlow(null)

    private val dependencies: AppDependencies = dependenciesOf(
        playerLanguage = latestRead,
        sessions = sessions,
        reports = reports,
    )

    private val nothingDue: TownReport = TownReport(
        dueCount = 0,
        readFirst = emptyList(),
        nextDueAt = null,
        news = emptyList(),
        readAt = Instant.parse("2026-11-05T10:00:00Z"),
    )

    private fun showNews(language: PlayerLanguage) {
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        show(language, Destination.Today, Destination.Town, Destination.News)
        waitForLine("No news.", "No hay noticias.")
    }

    private fun showMe(language: PlayerLanguage) {
        show(language, Destination.Today, Destination.Settings)
        waitForLine("Sign out", "Salir")
    }

    private fun show(language: PlayerLanguage, vararg destinations: Destination) {
        latestRead.value = language
        reports.answerRead(ReportReadResult.Read(nothingDue))
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations),
                )
            }
        }
    }

    private fun showSignIn() {
        sessions.answerRestore(RestoreResult.SignedOut)
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = emptyFlow(), mailedLinks = emptyFlow())
            }
        }
    }

    private fun waitForLine(vararg lines: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            lines.any { line: String -> composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
        }
    }

    private fun textField(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))

    private fun countOf(line: String): Int = composeRule.onAllNodesWithText(line).fetchSemanticsNodes().size

    @Test
    fun `draws the news in Spanish on an English phone in the Spanish phase`() {
        showNews(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onAllNodesWithText("Noticias del pueblo").assertCountEquals(1)
        composeRule.onAllNodesWithText("Town News").assertCountEquals(0)
        composeRule.onAllNodesWithText("Pueblo").assertCountEquals(1)
    }

    @Test
    fun `draws a screen the chrome has not reached in the scaffold language on an English phone`() {
        sessions.answerRestore(
            RestoreResult.SignedIn(
                SignedInPlayer("ines@example.com", isEmailVerified = false, scaffold = PlayerScaffold.Spanish),
            ),
        )

        showNews(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.English))

        waitForLine("Confirma tu correo")
        composeRule.onAllNodesWithText("Confirm your email").assertCountEquals(0)
    }

    @Test
    fun `draws the phase of the latest read over the one before it`() {
        showNews(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        latestRead.value = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both)
        waitForLine("Town News")

        composeRule.onAllNodesWithText("Town News").assertCountEquals(1)
        composeRule.onAllNodesWithText("Noticias del pueblo").assertCountEquals(1)
        latestRead.value = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.English)
        composeRule.waitUntil(WAIT_MILLIS) { countOf("Noticias del pueblo") == 0 }
        composeRule.onAllNodesWithText("Town News").assertCountEquals(1)
        composeRule.onAllNodesWithText("Town").assertCountEquals(1)
    }

    @Test
    fun `keeps Me in the player's language while it signs out`() {
        showMe(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        latestRead.value = null
        composeRule.waitForIdle()

        composeRule.onAllNodesWithText("Ajustes").assertCountEquals(1)
        composeRule.onAllNodesWithText("Settings").assertCountEquals(0)
    }

    @Test
    fun `keeps every link open after a sign-out that forgets the player's language`() {
        showMe(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        latestRead.value = null
        sessions.answerSignOut()
        repeat(SIGNED_OUT_READS) { sessions.answerRestore(RestoreResult.SignedOut) }
        waitForLine("Sign in to your town")
        composeRule.onNodeWithText("Create your account").performScrollTo().performClick()
        waitForLine("Create account")
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Sign in").performScrollTo().performClick()

        waitForLine("Sign in to your town")
    }

    @Test
    @OptIn(ExperimentalTestApi::class)
    fun `draws the next player's banner in the phone's English before any language read answers`() {
        val unverifiedEnglishPlayer: SignedInPlayer =
            SignedInPlayer("noah@example.com", isEmailVerified = false, scaffold = PlayerScaffold.None)
        showMe(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        latestRead.value = null
        sessions.answerSignOut()
        waitForLine("Sign in to your town")
        composeRule.waitForIdle()
        sessions.answerRestore(RestoreResult.SignedOut)
        composeRule.waitUntilAtLeastOneExists(hasSetTextAction() and hasContentDescription("Email"), WAIT_MILLIS)
        sessions.answerSignIn(SignInResult.SignedIn(unverifiedEnglishPlayer))
        sessions.answerRestore(RestoreResult.SignedIn(unverifiedEnglishPlayer))
        textField("Email").performTextInput("noah@example.com")
        textField("Password").performTextInput("iron-and-wool")
        composeRule.onNodeWithText("Sign in").performScrollTo().performClick()

        waitForLine("Confirm your email", "Confirma tu correo")
        composeRule.onAllNodesWithText("Confirm your email").assertCountEquals(1)
        composeRule.onAllNodesWithText("Confirma tu correo").assertCountEquals(0)
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
