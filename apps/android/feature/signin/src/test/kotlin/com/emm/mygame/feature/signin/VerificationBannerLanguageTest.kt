package com.emm.mygame.feature.signin

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class VerificationBannerLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sent: VerificationBannerUiState =
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Sent)

    private val unreachable: VerificationBannerUiState =
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Unreachable)

    private val mailNotSent: VerificationBannerUiState =
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.MailNotSent)

    private fun show(language: CopyLanguage, state: VerificationBannerUiState = sent) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    VerificationBannerScreen(state = state, onIntent = {})
                }
            }
        }
    }

    private fun assertDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(1) }
    }

    private fun assertNotDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(0) }
    }

    @Test
    fun `draws the banner in Spanish in the Spanish phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold))

        assertDrawn("Confirma tu correo", "Reenviar", "Enviado. Revisa tu correo.")
        assertNotDrawn("Confirm your email", "Send again", "Sent. Check your email.")
    }

    @Test
    fun `draws the banner in Spanish alone in the both phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both))

        assertDrawn("Confirma tu correo", "Reenviar", "Enviado. Revisa tu correo.")
        assertNotDrawn("Confirm your email", "Send again", "Sent. Check your email.")
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English))

        assertDrawn("Confirma tu correo", "Reenviar", "Enviado. Revisa tu correo.")
        assertNotDrawn("Confirm your email", "Send again", "Sent. Check your email.")
    }

    @Test
    fun `draws a failed resend in Spanish for an es player in the English phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English), unreachable)

        assertDrawn("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
        assertNotDrawn("We could not reach the server. Try again in a moment.")
    }

    @Test
    fun `draws a mail not sent in Spanish for an es player in the English phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English), mailNotSent)

        assertDrawn("No hemos podido enviarlo.")
        assertNotDrawn("We could not send it.")
    }

    @Test
    fun `draws the banner in English under none`() {
        show(CopyLanguage(ScaffoldLanguage.None, ChromePhase.English))

        assertDrawn("Confirm your email", "Send again", "Sent. Check your email.")
        assertNotDrawn("Confirma tu correo", "Reenviar", "Enviado. Revisa tu correo.")
    }
}
