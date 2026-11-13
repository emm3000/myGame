package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.VerificationResendResult
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class VerificationBannerNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessionsFake: FakeSessionRepository = FakeSessionRepository()

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val reportsFake: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = Clock.System
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val sessions: SessionRepository = sessionsFake
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = reportsFake
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
    }

    private val unverifiedSession: RestoreResult =
        RestoreResult.SignedIn(SignedInPlayer("player@example.com", isEmailVerified = false))

    private val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(SignedInPlayer("player@example.com", isEmailVerified = true))

    private val heldTown: TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = listOf(
            TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null),
            TownSnapshot.Building(TownBuildingKind.Office, level = 0, next = null),
        ),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = emptyList(),
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
        lessonSlot = null,
        hiring = hiringOf(),
        job = null,
        nextStep = NextStep.CaughtUp(goal = null),
        tip = null,
        nextDueAt = null,
        readAt = Instant.parse("2026-11-05T10:00:00Z"),
    )

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    @Test
    fun `draws the banner at the foot of the town home, under its header`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(TOWN_HEADER)

        waitForLine(BANNER_LINE)

        assertTrue(boundsOf(TOWN_HEADER).bottom <= boundsOf(BANNER_LINE).top)
        assertTrue(isResendAtTheFoot())
    }

    @Test
    fun `draws the banner at the foot of the school, under the frame's header`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(BANNER_LINE)

        door("Escuela").performClick()
        waitForLine(BACK_LINK)

        assertTrue(boundsOf(BACK_LINK).bottom <= boundsOf(BANNER_LINE).top)
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
        sessionsFake.answerRestore(verifiedSession)

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
        sessionsFake.answerResend(VerificationResendResult.Sent)
        waitForLine("Enviado. Revisa tu correo.")

        assertEquals(1, sessionsFake.resendCount)
    }

    @Test
    fun `draws no banner on sign-in once the unverified player signs out`() {
        signedIn(session = unverifiedSession, town = TownReadResult.Read(heldTown))
        waitForLine(BANNER_LINE)
        reportsFake.answerRead(ReportReadResult.Read(nothingDue))
        door("Informe").performClick()
        waitForLine("NOTICIAS DEL PUEBLO")
        sessionsFake.answerSignOut()
        sessionsFake.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        waitForLine("Entrar")

        composeRule.onAllNodesWithText(BANNER_LINE).assertCountEquals(0)
    }

    private fun signedIn(session: RestoreResult, town: TownReadResult) {
        repeat(SESSION_READS) { sessionsFake.answerRestore(session) }
        repeat(READS_AVAILABLE) { townsFake.answerRead(town) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies)
            }
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun door(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasText(label).and(hasTestTag(OUTLINED_PILL)))

    private fun isResendAtTheFoot(): Boolean {
        val resend: Rect = boundsOf(RESEND)
        val screen: Rect = composeRule.onRoot().fetchSemanticsNode().boundsInRoot
        return screen.bottom - resend.bottom < resend.height
    }

    private fun boundsOf(line: String): Rect = composeRule.onNodeWithText(line).fetchSemanticsNode().boundsInRoot

    private companion object {
        const val TOWN_HEADER: String = "RIVERTON · PUEBLO"
        const val BACK_LINK: String = "PUEBLO"
        const val BANNER_LINE: String = "Confirma tu correo"
        const val RESEND: String = "Reenviar"
        const val SESSION_READS: Int = 2
        const val READS_AVAILABLE: Int = 5
        const val WAIT_MILLIS: Long = 5_000
    }
}
