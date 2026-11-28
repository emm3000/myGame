package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.ScaffoldChangeResult
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeThemeSettings
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.compose.KoinIsolatedContext
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Instant

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

    private val app: FakeAppGraph = FakeAppGraph(
        ports = fakePortBindings(
            sessions = sessionsHoldingTheAnsweredLanguage,
            reports = reports,
            themes = themes,
        ),
        playerLanguage = latestRead,
        playerScaffold = heldScaffold,
    )

    private val nothingDue: TownReport = TownReport(
        dueCount = 0,
        readFirst = emptyList(),
        nextDueAt = null,
        news = emptyList(),
        readAt = Instant.parse("2026-11-05T10:00:00Z"),
    )

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
                KoinIsolatedContext(context = app.graph) {
                    AppNavigation(
                        dependencies = app,
                        reminderTaps = emptyFlow(),
                        mailedLinks = emptyFlow(),
                        backStack = backStack,
                    )
                }
            }
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
    }

    @Test
    fun `opens the settings from the Me tab`() {
        show(Destination.Today)
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasContentDescription("Yo") and hasClickAction()).fetchSemanticsNodes().isNotEmpty()
        }

        composeRule.onNode(hasContentDescription("Yo") and hasClickAction()).performClick()

        waitForLine("Idioma de ayuda")
        assertEquals(listOf(Destination.Today, Destination.Settings), shownBackStack)
    }

    @Test
    fun `stores the theme tapped in the settings`() {
        show(Destination.Today, Destination.Settings)
        waitForLine("Oscuro")

        composeRule.onNodeWithText("Oscuro").performScrollTo().performClick()
        composeRule.waitForIdle()

        assertEquals(ThemePick.Dark, themes.pick.value)
    }

    @Test
    fun `stores the theme tapped while the settings cannot be read`() {
        showReading(RestoreResult.Unreachable, Destination.Today, Destination.Settings)
        waitForLine("No hemos podido cargar tus ajustes.")
        waitForLine("Oscuro")

        composeRule.onNodeWithText("Oscuro").performScrollTo().performClick()
        composeRule.waitForIdle()

        assertEquals(ThemePick.Dark, themes.pick.value)
    }

    @Test
    fun `keeps the old language while the change waits`() {
        show(Destination.Today, Destination.Settings)
        waitForLine(NONE_OPTION_IN_SPANISH)

        composeRule.onNodeWithText(NONE_OPTION_IN_SPANISH).performScrollTo().performClick()
        waitForLine("Guardando…")

        composeRule.onAllNodes(hasText("Yo") and isHeading()).assertCountEquals(1)
        composeRule.onAllNodes(hasText("Me") and isHeading()).assertCountEquals(0)
    }

    @Test
    fun `draws the new scaffold's language after a change`() {
        show(Destination.Today, Destination.Settings)
        waitForLine(NONE_OPTION_IN_SPANISH)

        composeRule.onNodeWithText(NONE_OPTION_IN_SPANISH).performScrollTo().performClick()
        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.None)))

        waitForLine("Saved.")
        composeRule.onAllNodes(hasText("Me") and isHeading()).assertCountEquals(1)
        composeRule.onAllNodes(hasText("Yo") and isHeading()).assertCountEquals(0)
        composeRule.onAllNodes(hasContentDescription("Town") and hasClickAction()).assertCountEquals(1)
    }

    @Test
    fun `draws Today in English on the way back from a change to none`() {
        show(Destination.Today, Destination.Settings)
        waitForLine(NONE_OPTION_IN_SPANISH)
        composeRule.onNodeWithText(NONE_OPTION_IN_SPANISH).performScrollTo().performClick()
        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.None)))
        waitForLine("Saved.")

        composeRule.activityRule.scenario.onActivity { activity: ComponentActivity ->
            activity.onBackPressedDispatcher.onBackPressed()
        }

        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasContentDescription("Reading your town…")).fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodes(hasContentDescription("Estamos leyendo tu pueblo…")).assertCountEquals(0)
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
