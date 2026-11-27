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
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ForgotPasswordScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `reads the reset request title as a heading`() {
        draw(form(ForgotPasswordUiState.FormStatus.Idle))

        composeRule.onNode(isHeading() and hasText("Recupera tu contraseña")).assertIsDisplayed()
    }

    @Test
    fun `offers the email field to autofill as an email address`() {
        draw(form(ForgotPasswordUiState.FormStatus.Idle))

        field("Correo").assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.EmailAddress))
    }

    @Test
    fun `submits the request from the send link button`() {
        val intents: MutableList<ForgotPasswordIntent> = mutableListOf()
        draw(
            state = form(ForgotPasswordUiState.FormStatus.Idle),
            onIntent = { intent: ForgotPasswordIntent -> intents += intent },
        )

        composeRule.onNode(hasClickAction() and hasText("Enviar enlace")).performClick()

        assertEquals(listOf<ForgotPasswordIntent>(ForgotPasswordIntent.SubmitTapped), intents)
    }

    @Test
    fun `draws the malformed email line beside the form`() {
        draw(form(ForgotPasswordUiState.FormStatus.MalformedEmail))

        composeRule.onNodeWithText("Escribe un correo válido, como nombre@ejemplo.com.").assertIsDisplayed()
        field("Correo").assertIsDisplayed()
    }

    @Test
    fun `draws the unexpected line beside the form`() {
        draw(form(ForgotPasswordUiState.FormStatus.Unexpected))

        composeRule
            .onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
        field("Correo").assertIsDisplayed()
    }

    @Test
    fun `replaces the form with the confirmation`() {
        draw(ForgotPasswordUiState.Sent)

        composeRule
            .onNodeWithText("Si ese correo tiene una cuenta y está confirmado, te llegará un enlace que vale una hora.")
            .assertIsDisplayed()
        field("Correo").assertDoesNotExist()
    }

    @Test
    fun `returns to sign-in from the link under the form`() {
        var signInsOpened: Int = 0
        draw(form(ForgotPasswordUiState.FormStatus.Idle), onSignInOpen = { signInsOpened += 1 })

        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo")).performClick()

        assertEquals(1, signInsOpened)
    }

    @Test
    fun `holds the sign-in link while the reset mail is sending`() {
        draw(form(ForgotPasswordUiState.FormStatus.Sending))

        signInLink().assertIsNotEnabled()
    }

    @Test
    fun `keeps sign-in closed when its link is tapped while the reset mail is sending`() {
        var signInsOpened: Int = 0
        draw(form(ForgotPasswordUiState.FormStatus.Sending), onSignInOpen = { signInsOpened += 1 })

        signInLink().performClick()

        assertEquals(0, signInsOpened)
    }

    @Test
    fun `returns to sign-in from the link under the confirmation`() {
        var signInsOpened: Int = 0
        draw(ForgotPasswordUiState.Sent, onSignInOpen = { signInsOpened += 1 })

        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo")).performClick()

        assertEquals(1, signInsOpened)
    }

    private fun draw(
        state: ForgotPasswordUiState,
        onIntent: (ForgotPasswordIntent) -> Unit = {},
        onSignInOpen: () -> Unit = {},
    ) {
        composeRule.setContent {
            MyGameTheme {
                ForgotPasswordScreen(state = state, onIntent = onIntent, onSignInOpen = onSignInOpen)
            }
        }
    }

    private fun form(status: ForgotPasswordUiState.FormStatus): ForgotPasswordUiState.Form =
        ForgotPasswordUiState.Form(email = "ines@sotoverde.es", status = status)

    private fun field(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))

    private fun signInLink(): SemanticsNodeInteraction =
        composeRule.onNode(hasClickAction() and hasText("Entra en tu pueblo"))
}
