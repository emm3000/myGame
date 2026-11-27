package com.emm.mygame.feature.account.password

import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ResetPasswordScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `reads the new password title as a heading`() {
        draw(form(ResetPasswordUiState.FormStatus.Idle))

        composeRule.onNode(isHeading() and hasText("Elige una contraseña nueva")).assertIsDisplayed()
    }

    @Test
    fun `offers the password field to autofill as a new password`() {
        draw(form(ResetPasswordUiState.FormStatus.Idle))

        field("Contraseña nueva")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.NewPassword))
    }

    @Test
    fun `submits the new password from the change button`() {
        val intents: MutableList<ResetPasswordIntent> = mutableListOf()
        draw(
            state = form(ResetPasswordUiState.FormStatus.Idle),
            onIntent = { intent: ResetPasswordIntent -> intents += intent },
        )

        composeRule.onNode(hasClickAction() and hasText("Cambiar la contraseña")).performClick()

        assertEquals(listOf<ResetPasswordIntent>(ResetPasswordIntent.SubmitTapped), intents)
    }

    @Test
    fun `draws the weak password line beside the form`() {
        draw(form(ResetPasswordUiState.FormStatus.WeakPassword))

        composeRule.onNodeWithText("Tu contraseña necesita al menos 8 caracteres.").assertIsDisplayed()
        field("Contraseña nueva").assertIsDisplayed()
    }

    @Test
    fun `draws the unexpected line beside the form`() {
        draw(form(ResetPasswordUiState.FormStatus.Unexpected))

        composeRule
            .onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
        field("Contraseña nueva").assertIsDisplayed()
    }

    @Test
    fun `replaces the form with the changed password line`() {
        draw(ResetPasswordUiState.Changed)

        composeRule.onNodeWithText("Tu contraseña ha cambiado y hemos cerrado todas tus sesiones.").assertIsDisplayed()
        field("Contraseña nueva").assertDoesNotExist()
    }

    @Test
    fun `opens sign-in from the changed password`() {
        var signInsOpened: Int = 0
        draw(ResetPasswordUiState.Changed, onSignInOpen = { signInsOpened += 1 })

        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo")).performClick()

        assertEquals(1, signInsOpened)
    }

    @Test
    fun `opens sign-in from the new password form`() {
        var signInsOpened: Int = 0
        draw(form(ResetPasswordUiState.FormStatus.Idle), onSignInOpen = { signInsOpened += 1 })

        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo")).performScrollTo().performClick()

        assertEquals(1, signInsOpened)
    }

    @Test
    fun `holds the sign-in link while the new password is sending`() {
        draw(form(ResetPasswordUiState.FormStatus.Sending))

        signInLink().performScrollTo().assertIsNotEnabled()
    }

    @Test
    fun `keeps sign-in closed when its link is tapped while the new password is sending`() {
        var signInsOpened: Int = 0
        draw(form(ResetPasswordUiState.FormStatus.Sending), onSignInOpen = { signInsOpened += 1 })

        signInLink().performScrollTo().performClick()

        assertEquals(0, signInsOpened)
    }

    @Test
    fun `opens sign-in from the refused link`() {
        var signInsOpened: Int = 0
        draw(ResetPasswordUiState.LinkRefused, onSignInOpen = { signInsOpened += 1 })

        signInLink().performScrollTo().assertIsDisplayed().performClick()

        assertEquals(1, signInsOpened)
    }

    @Test
    fun `replaces the form with the refused link line`() {
        draw(ResetPasswordUiState.LinkRefused)

        composeRule
            .onNodeWithText("Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.")
            .assertIsDisplayed()
        field("Contraseña nueva").assertDoesNotExist()
    }

    @Test
    fun `opens the forgot-password screen from the refused link`() {
        var forgotPasswordsOpened: Int = 0
        draw(ResetPasswordUiState.LinkRefused, onForgotPasswordOpen = { forgotPasswordsOpened += 1 })

        composeRule.onNode(hasClickAction() and hasText("Pedir otro enlace")).performClick()

        assertEquals(1, forgotPasswordsOpened)
    }

    private fun draw(
        state: ResetPasswordUiState,
        onIntent: (ResetPasswordIntent) -> Unit = {},
        onSignInOpen: () -> Unit = {},
        onForgotPasswordOpen: () -> Unit = {},
    ) {
        composeRule.setContent {
            MyGameTheme {
                ResetPasswordScreen(
                    state = state,
                    onIntent = onIntent,
                    onSignInOpen = onSignInOpen,
                    onForgotPasswordOpen = onForgotPasswordOpen,
                )
            }
        }
    }

    private fun form(status: ResetPasswordUiState.FormStatus): ResetPasswordUiState.Form =
        ResetPasswordUiState.Form(password = "hierro-y-lana", status = status)

    private fun field(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))

    private fun signInLink(): SemanticsNodeInteraction =
        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo"))
}
