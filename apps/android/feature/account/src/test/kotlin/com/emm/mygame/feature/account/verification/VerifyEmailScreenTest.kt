package com.emm.mygame.feature.account.verification

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.control.WORKING_DOTS
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val VERIFYING_LINE: String = "Estamos confirmando tu correo…"

@RunWith(RobolectricTestRunner::class)
class VerifyEmailScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val shown: MutableState<VerifyEmailUiState> = mutableStateOf(VerifyEmailUiState.Verifying)

    @Test
    fun `reads the confirm your email title as a heading`() {
        draw(VerifyEmailUiState.Verifying)

        composeRule.onNode(isHeading() and hasText("Confirma tu correo")).assertIsDisplayed()
    }

    @Test
    fun `draws the verifying line while the token is sent`() {
        draw(VerifyEmailUiState.Verifying)

        composeRule.onNodeWithText(VERIFYING_LINE).assertIsDisplayed()
    }

    @Test
    fun `draws the working dots beside the verifying line`() {
        draw(VerifyEmailUiState.Verifying)

        val dots: DpRect = composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true).getUnclippedBoundsInRoot()
        val line: DpRect =
            composeRule.onNodeWithText(VERIFYING_LINE, useUnmergedTree = true).getUnclippedBoundsInRoot()
        assertTrue(dots.right <= line.left)
        assertTrue(dots.top < line.bottom && line.top < dots.bottom)
    }

    @Test
    fun `draws no working dots once the verification has an answer`() {
        draw(VerifyEmailUiState.Verifying)

        listOf(VerifyEmailUiState.Verified, VerifyEmailUiState.LinkRefused, VerifyEmailUiState.Unexpected)
            .forEach { answered: VerifyEmailUiState ->
                shown.value = answered
                composeRule.waitForIdle()

                composeRule.onAllNodesWithTag(WORKING_DOTS, useUnmergedTree = true).assertCountEquals(0)
            }
    }

    @Test
    fun `draws the confirmed email line once verified`() {
        draw(VerifyEmailUiState.Verified)

        composeRule.onNodeWithText("Tu correo queda confirmado.").assertIsDisplayed()
    }

    @Test
    fun `opens the town from the verified state`() {
        var townOpens: Int = 0
        draw(state = VerifyEmailUiState.Verified, onTownOpen = { townOpens += 1 })

        composeRule.onNode(hasClickAction() and hasText("Ir a tu pueblo")).performClick()

        assertEquals(1, townOpens)
    }

    @Test
    fun `draws the refused link line for a link the api refused`() {
        draw(VerifyEmailUiState.LinkRefused)

        composeRule
            .onNodeWithText("Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.")
            .assertIsDisplayed()
    }

    @Test
    fun `opens the sign-in form from the refused link`() {
        var signInOpens: Int = 0
        draw(state = VerifyEmailUiState.LinkRefused, onSignInOpen = { signInOpens += 1 })

        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo")).performClick()

        assertEquals(1, signInOpens)
    }

    @Test
    fun `draws the unexpected line when the api could not be reached`() {
        draw(VerifyEmailUiState.Unexpected)

        composeRule
            .onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
    }

    @Test
    fun `retries the verification from the unexpected line`() {
        val intents: MutableList<VerifyEmailIntent> = mutableListOf()
        draw(state = VerifyEmailUiState.Unexpected, onIntent = { intent: VerifyEmailIntent -> intents += intent })

        composeRule.onNode(hasClickAction() and hasText("Volver a intentarlo")).performClick()

        assertEquals(listOf<VerifyEmailIntent>(VerifyEmailIntent.RetryTapped), intents)
    }

    private fun draw(
        state: VerifyEmailUiState,
        onIntent: (VerifyEmailIntent) -> Unit = {},
        onTownOpen: () -> Unit = {},
        onSignInOpen: () -> Unit = {},
    ) {
        shown.value = state
        composeRule.setContent {
            MyGameTheme {
                VerifyEmailScreen(
                    state = shown.value,
                    onIntent = onIntent,
                    onTownOpen = onTownOpen,
                    onSignInOpen = onSignInOpen,
                )
            }
        }
    }
}
