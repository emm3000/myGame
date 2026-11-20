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
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.PlayerChromePhase
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ScaffoldChangeResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeThemeSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class SettingsNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val latestRead: MutableStateFlow<PlayerLanguage?> =
        MutableStateFlow(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold))

    private val heldScaffold: MutableStateFlow<PlayerScaffold?> = MutableStateFlow(PlayerScaffold.Spanish)

    private val sessionsHoldingTheAnsweredLanguage: SessionRepository = object : SessionRepository by sessions {
        override suspend fun changeScaffold(scaffold: PlayerScaffold): ScaffoldChangeResult {
            val answer: ScaffoldChangeResult = sessions.changeScaffold(scaffold)
            val answered: PlayerScaffold? = (answer as? ScaffoldChangeResult.Changed)?.player?.scaffold
            if (answered == null) return answer
            latestRead.value = PlayerLanguage(answered, PlayerChromePhase.English)
            heldScaffold.value = answered
            return answer
        }
    }

    private val themes: FakeThemeSettings = FakeThemeSettings(ThemePick.System)

    private val dependencies: AppDependencies = dependenciesOf(
        playerLanguage = latestRead,
        playerScaffold = heldScaffold,
        sessions = sessionsHoldingTheAnsweredLanguage,
        reports = reports,
        themes = themes,
    )

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private val spanishSession: RestoreResult = sessionWith(PlayerScaffold.Spanish)

    private var shownBackStack: List<NavKey> = emptyList()

    private fun show(vararg destinations: Destination) {
        showReading(spanishSession, *destinations)
    }

    private fun showReading(session: RestoreResult, vararg destinations: Destination) {
        repeat(SESSION_READS) { sessions.answerRestore(session) }
        reports.answerRead(ReportReadResult.Read(nothingDue))
        composeRule.setContent {
            MyGameTheme {
                val backStack: NavBackStack<NavKey> = rememberNavBackStack(*destinations)
                shownBackStack = backStack
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    resetLinks = emptyFlow(),
                    backStack = backStack,
                )
            }
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun waitWithout(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isEmpty() }
    }

    @Test
    fun `opens the settings from the Report`() {
        show(Destination.Town, Destination.Report)
        waitForLine("Ajustes")

        composeRule.onNodeWithText("Ajustes").performScrollTo().performClick()

        waitForLine("Idioma de ayuda")
        assertEquals(listOf(Destination.Town, Destination.Report, Destination.Settings), shownBackStack)
    }

    @Test
    fun `stores the theme tapped in the settings`() {
        show(Destination.Town, Destination.Report, Destination.Settings)
        waitForLine("Oscuro")

        composeRule.onNodeWithText("Oscuro").performScrollTo().performClick()
        composeRule.waitForIdle()

        assertEquals(ThemePick.Dark, themes.pick.value)
    }

    @Test
    fun `stores the theme tapped while the settings cannot be read`() {
        showReading(RestoreResult.Unreachable, Destination.Town, Destination.Report, Destination.Settings)
        waitForLine("No hemos podido cargar tus ajustes.")
        waitForLine("Oscuro")

        composeRule.onNodeWithText("Oscuro").performScrollTo().performClick()
        composeRule.waitForIdle()

        assertEquals(ThemePick.Dark, themes.pick.value)
    }

    @Test
    fun `keeps the old language while the change waits`() {
        show(Destination.Town, Destination.Report, Destination.Settings)
        waitForLine(NONE_OPTION_IN_SPANISH)

        composeRule.onNodeWithText(NONE_OPTION_IN_SPANISH).performScrollTo().performClick()
        waitForLine("Guardando…")

        composeRule.onAllNodesWithText("Ajustes").assertCountEquals(1)
        composeRule.onAllNodesWithText("Settings").assertCountEquals(0)
    }

    @Test
    fun `draws the new scaffold's language after a change`() {
        show(Destination.Town, Destination.Report, Destination.Settings)
        waitForLine(NONE_OPTION_IN_SPANISH)

        composeRule.onNodeWithText(NONE_OPTION_IN_SPANISH).performScrollTo().performClick()
        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.None)))

        waitForLine("Saved.")
        composeRule.onAllNodesWithText("Settings").assertCountEquals(1)
        composeRule.onAllNodesWithText("Ajustes").assertCountEquals(0)
        composeRule.onAllNodesWithText("Town").assertCountEquals(1)
    }

    @Test
    fun `draws the Report in English on the way back from a change to none`() {
        show(Destination.Town, Destination.Report, Destination.Settings)
        waitForLine(NONE_OPTION_IN_SPANISH)
        composeRule.onNodeWithText(NONE_OPTION_IN_SPANISH).performScrollTo().performClick()
        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.None)))
        waitForLine("Saved.")
        reports.answerRead(ReportReadResult.Read(nothingDue))

        composeRule.activityRule.scenario.onActivity { activity: ComponentActivity ->
            activity.onBackPressedDispatcher.onBackPressed()
        }

        waitForLine("Sign out")
        waitWithout("Salir")
        composeRule.onAllNodesWithText("Report").assertCountEquals(1)
    }

    private fun sessionWith(scaffold: PlayerScaffold): RestoreResult = RestoreResult.SignedIn(playerWith(scaffold))

    private fun playerWith(scaffold: PlayerScaffold): SignedInPlayer =
        SignedInPlayer(email = "ines@example.com", isEmailVerified = true, scaffold = scaffold)

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SESSION_READS: Int = 3
        const val NONE_OPTION_IN_SPANISH: String = "Ninguno: todo en inglés, con definiciones en inglés"
    }
}
