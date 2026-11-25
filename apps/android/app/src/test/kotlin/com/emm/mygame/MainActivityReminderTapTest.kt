package com.emm.mygame

import android.content.Intent
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
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
        application.sessions.answerRestore(
            RestoreResult.SignedIn(
                SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
        )
    }

    @Test
    fun `a tap of the words reminder opens the Report above Today`() {
        Robolectric.buildActivity(MainActivity::class.java, tapOf(StudyReminderLine.Cards)).setup()

        waitForLine(TODAY_LINK)
    }

    @Test
    fun `a tap that reaches the open app opens its line`() {
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitFor(townLoading)

        activity.newIntent(tapOf(StudyReminderLine.Cards))

        waitForLine(TODAY_LINK)
    }

    @Test
    fun `a launch from Recents opens no reminder line`() {
        val replayed: Intent = tapOf(StudyReminderLine.Cards).addFlags(Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)

        Robolectric.buildActivity(MainActivity::class.java, replayed).setup()

        assertOnTodayAlone()
    }

    @Test
    fun `a recreated activity opens no reminder line again`() {
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, tapOf(StudyReminderLine.Cards)).setup()
        waitFor(hasText(TODAY_LINK).and(hasClickAction()))
        composeRule.onNode(hasText(TODAY_LINK).and(hasClickAction())).performClick()
        waitFor(townLoading)

        composeRule.runOnIdle { activity.recreate() }

        assertOnTodayAlone()
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

    private fun assertOnTodayAlone() {
        composeRule.waitUntil(WAIT_MILLIS) {
            listOf(townLoading, hasText(TODAY_LINK).and(isHeading())).any { matcher: SemanticsMatcher ->
                composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
            }
        }
        composeRule.onAllNodes(hasText(TODAY_LINK).and(hasClickAction())).assertCountEquals(0)
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val TODAY_LINK: String = "Hoy"
        const val TOWN_LOADING: String = "Estamos leyendo tu pueblo…"
    }
}
