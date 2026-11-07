package com.emm.mygame.feature.signin

import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SignUpScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Before
    fun drawBlankForm() {
        composeRule.setContent {
            MyGameTheme {
                SignUpScreen(state = blankForm, onIntent = {}, onSignInOpen = {})
            }
        }
    }

    @Test
    fun `offers the email field to autofill as an email address`() {
        field("Correo").assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.EmailAddress))
    }

    @Test
    fun `offers the password field to autofill as a new password`() {
        field("Contraseña").assert(
            SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.NewPassword),
        )
    }

    @Test
    fun `asks for the email and the password alone`() {
        composeRule.onAllNodes(hasSetTextAction()).assertCountEquals(2)
    }

    @Test
    fun `reads the password hint with the password field`() {
        field("Contraseña").assert(hasText("Al menos 8 caracteres."))
    }

    private val blankForm: SignUpUiState = SignUpUiState.Form(
        email = "",
        password = "",
        status = SignUpUiState.FormStatus.Idle,
    )

    private fun field(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))
}
