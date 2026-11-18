package com.emm.mygame

import android.content.Intent
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.projection.StudyReminderLine
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(application = ReminderTapApplication::class)
class MainActivitySettingsRecreateTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    @Before
    fun restoreASession() {
        val player: SignedInPlayer =
            SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish)
        repeat(SESSION_READS) { application.sessionsFake.answerRestore(RestoreResult.SignedIn(player)) }
        repeat(REPORT_READS) { application.reports.answerRead(ReportReadResult.Read(nothingDue)) }
    }

    @Test
    fun `picking a theme in the settings keeps the settings open with the new pick after the activity recreates`() {
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, reportTap()).setup()
        waitForLine(SETTINGS_LINK)
        composeRule.onNodeWithText(SETTINGS_LINK).performScrollTo().performClick()
        waitForLine(DARK_PICK)
        composeRule.onNodeWithText(DARK_PICK).performScrollTo().performClick()
        composeRule.waitForIdle()

        composeRule.runOnIdle { activity.recreate() }

        waitForLine(DARK_PICK)
        composeRule.onNodeWithText(DARK_PICK).assertIsSelected()
        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }
        waitForLine(SETTINGS_LINK)
        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasContentDescription(TOWN_LOADING)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun reportTap(): Intent = Intent(application, MainActivity::class.java)
        .putExtra(MainActivity.STUDY_REMINDER_LINE, StudyReminderLine.Cards.name)

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SESSION_READS: Int = 6
        const val REPORT_READS: Int = 3
        const val SETTINGS_LINK: String = "Ajustes"
        const val DARK_PICK: String = "Oscuro"
        const val TOWN_LOADING: String = "Estamos leyendo tu pueblo…"
    }
}
