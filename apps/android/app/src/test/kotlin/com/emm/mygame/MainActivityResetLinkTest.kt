package com.emm.mygame

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.emm.mygame.core.network.PasswordResetResult
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

    private val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )

    @Before
    fun restoreASession() {
        application.sessions.answerRestore(verifiedSession)
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
    fun `a signed-in player who changes the password from a mailed link reaches the sign-in form`() {
        Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()
        waitFor(newPasswordTitle)
        application.sessions.answerPasswordChange(PasswordResetResult.Changed)
        application.sessions.answerRestore(RestoreResult.SignedOut)
        composeRule.onNode(hasSetTextAction() and hasContentDescription(NEW_PASSWORD)).performTextInput("hierro-y-lana")
        composeRule.onNode(hasClickAction() and hasText(CHANGE_PASSWORD)).performClick()
        waitFor(hasText(PASSWORD_CHANGED))

        composeRule.onNode(hasClickAction() and hasText(TO_SIGN_IN)).performClick()

        waitFor(hasClickAction() and hasText(SIGN_IN))
    }

    @Test
    fun `back from a mailed link returns a signed-in player to the town`() {
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()
        waitFor(newPasswordTitle)
        application.sessions.answerRestore(verifiedSession)

        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }

        waitFor(townLoading)
    }

    @Test
    fun `back from a new link asked on a refused mailed link returns a signed-in player to the town`() {
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()
        waitFor(newPasswordTitle)
        application.sessions.answerPasswordChange(PasswordResetResult.LinkRefused)
        composeRule.onNode(hasSetTextAction() and hasContentDescription(NEW_PASSWORD)).performTextInput("hierro-y-lana")
        composeRule.onNode(hasClickAction() and hasText(CHANGE_PASSWORD)).performClick()
        waitFor(hasClickAction() and hasText(NEW_LINK))
        composeRule.onNode(hasClickAction() and hasText(NEW_LINK)).performClick()
        waitFor(isHeading() and hasText(FORGOT_PASSWORD_TITLE))
        application.sessions.answerRestore(verifiedSession)

        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }

        composeRule.waitForIdle()
        composeRule.onNode(townLoading).assertExists()
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
        const val NEW_PASSWORD: String = "Contraseña nueva"
        const val CHANGE_PASSWORD: String = "Cambiar la contraseña"
        const val PASSWORD_CHANGED: String = "Tu contraseña ha cambiado y hemos cerrado todas tus sesiones."
        const val TO_SIGN_IN: String = "Entra en tu pueblo"
        const val SIGN_IN: String = "Entrar"
        const val NEW_LINK: String = "Pedir otro enlace"
        const val FORGOT_PASSWORD_TITLE: String = "Recupera tu contraseña"
    }
}
