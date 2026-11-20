package com.emm.mygame

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
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
class MainActivityResetLinkTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    private val newPasswordTitle: SemanticsMatcher = isHeading() and hasText(NEW_PASSWORD_TITLE)

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
    fun `a mailed link opens the new password screen`() {
        Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()

        waitFor(newPasswordTitle)
    }

    @Test
    fun `a mailed link that reaches the open app opens the new password screen`() {
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitFor(townLoading)

        activity.newIntent(mailedLink())

        waitFor(newPasswordTitle)
    }

    @Test
    fun `a launch from Recents opens no new password screen`() {
        val replayed: Intent = mailedLink().addFlags(Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)

        Robolectric.buildActivity(MainActivity::class.java, replayed).setup()

        waitFor(townLoading)
        composeRule.onAllNodes(newPasswordTitle).assertCountEquals(0)
    }

    private fun mailedLink(): Intent =
        Intent(Intent.ACTION_VIEW, Uri.parse(MAILED_LINK)).setClass(application, MainActivity::class.java)

    private fun waitFor(matcher: SemanticsMatcher) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val MAILED_LINK: String = "https://mygame.emm3000.com/reset-password?token=rbi-I29wMEaqgA12gHRHjVk7"
        const val NEW_PASSWORD_TITLE: String = "Elige una contraseña nueva"
        const val TOWN_LOADING: String = "Estamos leyendo tu pueblo…"
    }
}
