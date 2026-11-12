package com.emm.mygame.feature.signin

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class VerificationBannerScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `draws the line and the resend while the email is unverified`() {
        draw(banner(VerificationBannerUiState.Resend.Idle))

        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
        resend().assertIsDisplayed().assertIsEnabled()
    }

    @Test
    fun `draws nothing once the email is verified`() {
        draw(VerificationBannerUiState.Hidden)

        composeRule.onAllNodesWithText(BANNER_LINE).assertCountEquals(0)
        composeRule.onAllNodesWithText(RESEND).assertCountEquals(0)
        assertEquals(0, composeRule.onRoot().fetchSemanticsNode().size.height)
    }

    @Test
    fun `asks for the resend from its button`() {
        val intents: MutableList<VerificationBannerIntent> = mutableListOf()
        draw(
            state = banner(VerificationBannerUiState.Resend.Idle),
            onIntent = { intent: VerificationBannerIntent -> intents += intent },
        )

        resend().performClick()

        assertEquals(listOf<VerificationBannerIntent>(VerificationBannerIntent.ResendTapped), intents)
    }

    @Test
    fun `keeps the resend in the layout and blocked while one waits`() {
        draw(banner(VerificationBannerUiState.Resend.Sending))

        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
        composeRule.onNodeWithText(RESEND).assertIsDisplayed().assertIsNotEnabled()
    }

    @Test
    fun `draws the sent line beside the kept banner`() {
        draw(banner(VerificationBannerUiState.Resend.Sent))

        composeRule.onNodeWithText(SENT_LINE).assertIsDisplayed()
        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
        resend().assertIsEnabled()
    }

    @Test
    fun `draws the mail-not-sent line beside the kept banner`() {
        draw(banner(VerificationBannerUiState.Resend.MailNotSent))

        composeRule.onNodeWithText("No hemos podido enviarlo.").assertIsDisplayed()
        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
        resend().assertIsEnabled()
    }

    @Test
    fun `draws the unreachable line beside the kept banner`() {
        draw(banner(VerificationBannerUiState.Resend.Unreachable))

        composeRule
            .onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
        composeRule.onNodeWithText(BANNER_LINE).assertIsDisplayed()
        resend().assertIsEnabled()
    }

    @Test
    fun `draws no outcome line before a resend`() {
        draw(banner(VerificationBannerUiState.Resend.Idle))

        composeRule.onAllNodesWithText(SENT_LINE).assertCountEquals(0)
        composeRule.onAllNodesWithText("No hemos podido enviarlo.").assertCountEquals(0)
    }

    private fun draw(state: VerificationBannerUiState, onIntent: (VerificationBannerIntent) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                VerificationBannerScreen(state = state, onIntent = onIntent)
            }
        }
    }

    private fun banner(resend: VerificationBannerUiState.Resend): VerificationBannerUiState =
        VerificationBannerUiState.Unverified(resend = resend)

    private fun resend(): SemanticsNodeInteraction = composeRule.onNode(hasClickAction() and hasText(RESEND))

    private companion object {
        const val BANNER_LINE: String = "Confirma tu correo"
        const val RESEND: String = "Reenviar"
        const val SENT_LINE: String = "Enviado. Revisa tu correo."
    }
}
