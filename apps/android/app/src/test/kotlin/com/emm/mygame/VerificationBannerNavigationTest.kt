package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.NAVIGATION_BAR
import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.account.VerificationResendResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.AppNavigation
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class VerificationBannerNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val readLanguage: MutableStateFlow<PlayerLanguage?> = MutableStateFlow(null)

    private val dependencies: AppDependencies = dependenciesOf(
        playerLanguage = readLanguage,
        sessions = sessions,
        towns = towns,
    )

    private val unverifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = false, scaffold = PlayerScaffold.Spanish),
        )

    private val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )

    private val heldTown: TownSnapshot = townOf(Instant.parse("2026-11-05T10:00:00Z"))

    @Test
    fun `draws the banner at the foot of the town home, under its header`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(TOWN_HEADER)

        waitForLine(BANNER_LINE)

        assertTrue(boundsOf(TOWN_HEADER).bottom <= boundsOf(BANNER_LINE).top)
        assertTrue(isResendAtTheFoot())
    }

    @Test
    fun `draws the banner at the foot of the school, under the navigation bar`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(BANNER_LINE)
        composeRule.onNode(hasText("Escuela") and hasClickAction() and !isSelectable()).performScrollTo().performClick()
        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForHeading(LEARN_TITLE)

        val bar: Rect = composeRule.onNode(hasTestTag(NAVIGATION_BAR)).fetchSemanticsNode().boundsInRoot

        assertTrue(bar.bottom <= boundsOf(BANNER_LINE).top)
        assertTrue(isResendAtTheFoot())
    }

    @Test
    fun `draws the banner for a player with no town`() {
        signedIn(session = unverifiedSession, town = TownReadResult.NoTown)
        waitForLine("Ponle nombre a tu pueblo")

        waitForLine(BANNER_LINE)

        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
    }

    @Test
    fun `draws no banner for a player whose email is verified`() {
        signedIn(session = verifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(TOWN_HEADER)
        composeRule.waitForIdle()

        composeRule.onAllNodesWithText(BANNER_LINE).assertCountEquals(0)
    }

    @Test
    fun `hides the banner on the return from a verify made on the web`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(BANNER_LINE)
        sessions.answerRestore(verifiedSession)

        composeRule.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        composeRule.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(BANNER_LINE)).fetchSemanticsNodes().isEmpty()
        }

        composeRule.onNodeWithText(TOWN_HEADER).assertIsDisplayed()
    }

    @Test
    fun `draws the sent line once the api takes the resend`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(BANNER_LINE)

        composeRule.onNodeWithText(RESEND).performClick()
        sessions.answerResend(VerificationResendResult.Sent)
        waitForLine("Enviado. Revisa tu correo.")

        assertEquals(1, sessions.resendCount)
    }

    @Test
    fun `draws no banner on sign-in once the unverified player signs out`() {
        signedInOnMe(session = unverifiedSession)
        waitForLine(BANNER_LINE)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)
        waitForLine("Entrar")

        composeRule.onAllNodesWithText(BANNER_LINE).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "en")
    fun `keeps the banner in the player's language on an English phone while a later read loads`() {
        readLanguage.value = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold)
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(BANNER_LINE)

        readLanguage.value = null
        composeRule.waitForIdle()

        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
        composeRule.onAllNodesWithText("Confirm your email").assertCountEquals(0)
    }

    private fun signedIn(session: RestoreResult, town: TownReadResult) {
        repeat(SESSION_READS) { sessions.answerRestore(session) }
        repeat(READS_AVAILABLE) { towns.answerRead(town) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = emptyFlow(), mailedLinks = emptyFlow())
            }
        }
        if (town is TownReadResult.Read) openTab("Pueblo")
    }

    private fun signedInOnMe(session: RestoreResult) {
        signedIn(session = session, town = TownReadResult.Read(heldTown))
        openTab("Yo")
        waitForLine("Salir")
    }

    private fun openTab(label: String) {
        val tab: SemanticsMatcher =
            hasContentDescription(label).and(hasAnyAncestor(hasTestTag(NAVIGATION_BAR))).and(hasClickAction())
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(tab).fetchSemanticsNodes().isNotEmpty() }
        composeRule.onNode(tab).performClick()
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun waitForHeading(heading: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(heading) and isHeading()).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun isResendAtTheFoot(): Boolean {
        val resend: Rect = boundsOf(RESEND)
        val screen: Rect = composeRule.onRoot().fetchSemanticsNode().boundsInRoot
        return screen.bottom - resend.bottom < resend.height
    }

    private fun boundsOf(line: String): Rect = composeRule.onNodeWithText(line).fetchSemanticsNode().boundsInRoot

    private companion object {
        const val TOWN_HEADER: String = "Riverton · Pueblo"
        const val BANNER_LINE: String = "Confirma tu correo"
        const val RESEND: String = "Reenviar"
        const val LEARN_TITLE: String = "Aprender"
        const val SESSION_READS: Int = 2
        const val READS_AVAILABLE: Int = 5
        const val WAIT_MILLIS: Long = 5_000
    }
}
