package com.emm.mygame

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.network.EmailVerificationResult
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
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
class MainActivityVerifyLinkTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val application: ReminderTapApplication = RuntimeEnvironment.getApplication() as ReminderTapApplication

    private val landingTitle: SemanticsMatcher = isHeading() and hasText(LANDING_TITLE)

    private val townLoading: SemanticsMatcher = hasContentDescription(TOWN_LOADING)

    private val bannerResend: SemanticsMatcher = hasClickAction() and hasText(BANNER_RESEND)

    private val unverifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("ines@example.com", isEmailVerified = false, scaffold = PlayerScaffold.Spanish),
        )

    private val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(
            SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )

    @Test
    fun `a mailed verification link opens the confirm-email landing for a signed-in player`() {
        application.sessions.answerRestore(unverifiedSession)

        Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()

        waitFor(landingTitle)
    }

    @Test
    fun `a mailed verification link opens the confirm-email landing for a signed-out player`() {
        application.sessions.answerRestore(RestoreResult.SignedOut)

        Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()

        waitFor(landingTitle)
    }

    @Test
    fun `a mailed verification link that reaches the open app opens the confirm-email landing`() {
        application.sessions.answerRestore(unverifiedSession)
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitFor(townLoading)

        activity.newIntent(mailedLink())

        waitFor(landingTitle)
    }

    @Test
    fun `back from a verification link returns a signed-in player to the town`() {
        application.sessions.answerRestore(unverifiedSession)
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()
        waitFor(landingTitle)
        application.sessions.answerRestore(unverifiedSession)

        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }

        waitFor(townLoading)
    }

    @Test
    fun `back from a verification link brings a signed-out player to the sign-in form`() {
        application.sessions.answerRestore(RestoreResult.SignedOut)
        val activity: ActivityController<MainActivity> =
            Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()
        waitFor(landingTitle)
        application.sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.runOnIdle { activity.get().onBackPressedDispatcher.onBackPressed() }

        waitFor(hasClickAction() and hasText(SIGN_IN))
    }

    @Test
    fun `a confirmed email heads a signed-in player to the town`() {
        application.sessions.answerRestore(unverifiedSession)
        Robolectric.buildActivity(MainActivity::class.java, mailedLink()).setup()
        application.sessions.answerEmailVerification(EmailVerificationResult.Verified)
        waitFor(hasText(VERIFIED))
        application.sessions.answerRestore(verifiedSession)

        composeRule.onNode(hasClickAction() and hasText(TO_TOWN)).performClick()

        waitFor(townLoading)
    }

    @Test
    fun `the town draws no banner once a mailed link confirmed the email`() {
        val activity: ActivityController<MainActivity> = openTownWithBanner()
        activity.newIntent(mailedLink())
        application.sessions.answerEmailVerification(EmailVerificationResult.Verified)
        waitFor(hasText(VERIFIED))
        application.sessions.answerRestore(verifiedSession)
        application.sessions.answerRestore(verifiedSession)

        composeRule.onNode(hasClickAction() and hasText(TO_TOWN)).performClick()

        waitFor(townLoading)
        composeRule.waitForIdle()
        composeRule.onAllNodes(bannerResend).assertCountEquals(0)
    }

    @Test
    fun `the town draws the banner again when the email is still unconfirmed`() {
        val activity: ActivityController<MainActivity> = openTownWithBanner()
        activity.newIntent(mailedLink())
        application.sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)
        waitFor(hasText(LINK_REFUSED))
        application.sessions.answerRestore(unverifiedSession)
        application.sessions.answerRestore(unverifiedSession)

        composeRule.onNode(hasClickAction() and hasText(TO_SIGN_IN)).performClick()

        waitFor(townLoading)
        waitFor(bannerResend)
    }

    @Test
    fun `a launch from Recents opens no confirm-email landing`() {
        application.sessions.answerRestore(unverifiedSession)
        val replayed: Intent = mailedLink().addFlags(Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)

        Robolectric.buildActivity(MainActivity::class.java, replayed).setup()

        waitFor(townLoading)
        composeRule.onAllNodes(landingTitle).assertCountEquals(0)
    }

    private fun openTownWithBanner(): ActivityController<MainActivity> {
        application.sessions.answerRestore(unverifiedSession)
        application.sessions.answerRestore(unverifiedSession)
        val activity: ActivityController<MainActivity> = Robolectric.buildActivity(MainActivity::class.java).setup()
        waitFor(townLoading)
        waitFor(bannerResend)
        return activity
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
        const val MAILED_LINK: String = "https://mygame.emm3000.com/verify-email?token=iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y"
        const val LANDING_TITLE: String = "Confirma tu correo"
        const val TOWN_LOADING: String = "Estamos leyendo tu pueblo…"
        const val BANNER_RESEND: String = "Reenviar"
        const val VERIFIED: String = "Tu correo queda confirmado."
        const val TO_TOWN: String = "Ir a tu pueblo"
        const val LINK_REFUSED: String = "Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro."
        const val TO_SIGN_IN: String = "Entra en tu pueblo"
        const val SIGN_IN: String = "Entrar"
    }
}
