package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
@Config(application = ReminderTapApplication::class)
class MainActivitySettingsRecreateTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    private val nothingDue: TownReport = TownReport(
        dueCount = 0,
        readFirst = emptyList(),
        nextDueAt = null,
        news = emptyList(),
        readAt = Instant.parse("2026-11-05T10:00:00Z"),
    )

    @Before
    fun restoreASession() {
        val player: SignedInPlayer =
            SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish)
        repeat(SESSION_READS) { application.sessions.answerRestore(RestoreResult.SignedIn(player)) }
        repeat(REPORT_READS) { application.reports.answerRead(ReportReadResult.Read(nothingDue)) }
    }

    @Test
    fun `picking a theme in the settings keeps the settings open with the new pick after the activity recreates`() {
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java).setup()
        val meTab: SemanticsMatcher = hasContentDescription(ME_TAB).and(hasClickAction())
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(meTab).fetchSemanticsNodes().isNotEmpty() }
        composeRule.onNode(meTab).performClick()
        waitForLine(DARK_PICK)
        composeRule.onNodeWithText(DARK_PICK).performScrollTo().performClick()
        composeRule.waitForIdle()

        composeRule.runOnIdle { activity.recreate() }

        waitForLine(DARK_PICK)
        composeRule.onNodeWithText(DARK_PICK).assertIsSelected()
        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasContentDescription(TOWN_LOADING)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SESSION_READS: Int = 6
        const val REPORT_READS: Int = 3
        const val ME_TAB: String = "Yo"
        const val DARK_PICK: String = "Oscuro"
        const val TOWN_LOADING: String = "Estamos leyendo tu pueblo…"
    }
}
