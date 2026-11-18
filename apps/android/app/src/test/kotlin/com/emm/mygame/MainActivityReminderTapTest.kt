package com.emm.mygame

import android.content.Intent
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
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
class MainActivityReminderTapTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    private val townLoading: SemanticsMatcher = hasContentDescription(TOWN_LOADING)

    @Before
    fun restoreASession() {
        application.sessionsFake.answerRestore(
            RestoreResult.SignedIn(
                SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
        )
    }

    @Test
    fun `a tap of the words reminder opens the Report above the town`() {
        Robolectric.buildActivity(MainActivity::class.java, tapOf(StudyReminderLine.Cards)).setup()

        waitForLine(BACK_TO_TOWN)
    }

    @Test
    fun `a tap that reaches the open app opens its line`() {
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitFor(townLoading)

        activity.newIntent(tapOf(StudyReminderLine.Cards))

        waitForLine(BACK_TO_TOWN)
    }

    @Test
    fun `a launch from Recents opens no reminder line`() {
        val replayed: Intent = tapOf(StudyReminderLine.Cards).addFlags(Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)

        Robolectric.buildActivity(MainActivity::class.java, replayed).setup()

        assertOnTheTownAlone()
    }

    @Test
    fun `a recreated activity opens no reminder line again`() {
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, tapOf(StudyReminderLine.Cards)).setup()
        waitForLine(BACK_TO_TOWN)
        composeRule.onNodeWithText(BACK_TO_TOWN).performClick()
        waitFor(townLoading)

        composeRule.runOnIdle { activity.recreate() }

        assertOnTheTownAlone()
    }

    private fun tapOf(line: StudyReminderLine): Intent =
        Intent(application, MainActivity::class.java).putExtra(MainActivity.STUDY_REMINDER_LINE, line.name)

    private fun waitForLine(line: String) {
        waitFor(hasText(line))
    }

    private fun waitFor(matcher: SemanticsMatcher) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun assertOnTheTownAlone() {
        composeRule.waitUntil(WAIT_MILLIS) {
            listOf(townLoading, hasText(BACK_TO_TOWN)).any { matcher: SemanticsMatcher ->
                composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
            }
        }
        composeRule.onAllNodes(hasText(BACK_TO_TOWN)).assertCountEquals(0)
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val BACK_TO_TOWN: String = "PUEBLO"
        const val TOWN_LOADING: String = "Estamos leyendo tu pueblo…"
    }
}
