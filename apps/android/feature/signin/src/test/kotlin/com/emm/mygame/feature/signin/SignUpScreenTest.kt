package com.emm.mygame.feature.signin

import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.PlayerScaffold
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val SPANISH_OPTION: String = "Español: una traducción junto a cada palabra nueva"
private const val NONE_OPTION: String = "Ninguno: todo en inglés, con definiciones en inglés"
private const val QUESTION: String = "Idioma de ayuda"
private const val CHANGE_LINE: String = "Puedes cambiarlo cuando quieras en Ajustes."

@RunWith(RobolectricTestRunner::class)
class SignUpScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val sentIntents: MutableList<SignUpIntent> = mutableListOf()

    @Test
    fun `offers the email field to autofill as an email address`() {
        drawForm()

        field("Correo").assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.EmailAddress))
    }

    @Test
    fun `offers the password field to autofill as a new password`() {
        drawForm()

        field("Contraseña").assert(
            SemanticsMatcher.expectValue(SemanticsProperties.ContentType, ContentType.NewPassword),
        )
    }

    @Test
    fun `asks for the email and the password alone`() {
        drawForm()

        composeRule.onAllNodes(hasSetTextAction()).assertCountEquals(2)
    }

    @Test
    fun `reads the password hint with the password field`() {
        drawForm()

        field("Contraseña").assert(hasText("Al menos 8 caracteres."))
    }

    @Test
    fun `asks for the help language above the email`() {
        drawForm()

        val choiceBottom: Dp = composeRule.onNodeWithText(NONE_OPTION).getUnclippedBoundsInRoot().bottom
        val emailTop: Dp = field("Correo").getUnclippedBoundsInRoot().top
        assertTrue(choiceBottom < emailTop)
    }

    @Test
    fun `offers each help language as a radio button of one group`() {
        drawForm()

        composeRule.onAllNodes(isRadioButton() and hasAnyAncestor(isSelectableGroup())).assertCountEquals(2)
    }

    @Test
    fun `reads the help language question as a heading`() {
        drawForm()

        composeRule.onNode(hasText(QUESTION) and isHeading()).assertExists()
    }

    @Test
    fun `names the help language group with its question`() {
        drawForm()

        composeRule.onNode(isSelectableGroup() and hasContentDescription(QUESTION)).assertExists()
    }

    @Test
    fun `announces the picked help language alone as selected`() {
        drawForm(scaffold = PlayerScaffold.None)

        option(NONE_OPTION).assertIsSelected()
        option(SPANISH_OPTION).assertIsNotSelected()
    }

    @Test
    fun `says under the help languages that the choice can change later`() {
        drawForm()

        val choiceBottom: Dp = composeRule.onNodeWithText(NONE_OPTION).getUnclippedBoundsInRoot().bottom
        val lineTop: Dp = composeRule.onNodeWithText(CHANGE_LINE).getUnclippedBoundsInRoot().top
        assertTrue(choiceBottom <= lineTop)
    }

    @Test
    fun `sends the help language the player taps`() {
        drawForm(scaffold = PlayerScaffold.Spanish)

        option(NONE_OPTION).performClick()

        assertEquals(listOf(SignUpIntent.ScaffoldPicked(PlayerScaffold.None)), sentIntents.toList())
    }

    private fun drawForm(scaffold: PlayerScaffold = PlayerScaffold.Spanish) {
        val form: SignUpUiState = SignUpUiState.Form(
            scaffold = scaffold,
            email = "",
            password = "",
            status = SignUpUiState.FormStatus.Idle,
        )
        composeRule.setContent {
            MyGameTheme {
                SignUpScreen(
                    state = form,
                    onIntent = { intent: SignUpIntent -> sentIntents += intent },
                    onSignInOpen = {},
                )
            }
        }
    }

    private fun field(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))

    private fun option(label: String): SemanticsNodeInteraction = composeRule.onNode(isSelectable() and hasText(label))

    private fun isRadioButton(): SemanticsMatcher =
        SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.RadioButton)

    private fun isSelectableGroup(): SemanticsMatcher =
        SemanticsMatcher.keyIsDefined(SemanticsProperties.SelectableGroup)
}
