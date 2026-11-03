package com.emm.mygame.feature.signin

import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SignInScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `offers the email field to autofill as an email address`() {
        drawBlankForm()

        field("Correo").assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.EmailAddress))
    }

    @Test
    fun `offers the password field to autofill as the current password`() {
        drawBlankForm()

        field("Contraseña").assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.Password))
    }

    @Test
    fun `opens the reset request from the link under the form`() {
        var resetRequestsOpened: Int = 0
        drawBlankForm(onForgotPasswordOpen = { resetRequestsOpened += 1 })

        composeRule.onNodeWithText("¿Has olvidado tu contraseña?").performClick()

        assertEquals(1, resetRequestsOpened)
    }

    private fun drawBlankForm(onForgotPasswordOpen: () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                SignInScreen(
                    state = blankForm,
                    onIntent = {},
                    onSignUpOpen = {},
                    onForgotPasswordOpen = onForgotPasswordOpen,
                )
            }
        }
    }

    private val blankForm: SignInUiState = SignInUiState.Form(
        email = "",
        password = "",
        status = SignInUiState.FormStatus.Idle,
        isSessionEnded = false,
    )

    private fun field(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))
}
