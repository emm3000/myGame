package com.emm.mygame.feature.account.auth

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.feature.account.signin.SignInScreen
import com.emm.mygame.feature.account.signin.SignInUiState
import com.emm.mygame.feature.account.signup.SignUpScreen
import com.emm.mygame.feature.account.signup.SignUpUiState
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(fontScale = 2.0f)
class AuthSwitchAtLargeFontTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "es-w360dp-h640dp")
    fun `wraps the sign-in switch by word in Spanish on a small phone at double font`() {
        drawSignIn()

        assertWrapsByWord("¿Aún no tienes cuenta?")
        assertWrapsByWord("Crea tu cuenta")
    }

    @Test
    @Config(qualifiers = "en-w360dp-h640dp")
    fun `wraps the sign-in switch by word with no scaffold on a small phone at double font`() {
        drawSignIn()

        assertWrapsByWord("No account yet?")
        assertWrapsByWord("Create your account")
    }

    @Test
    @Config(qualifiers = "es-w360dp-h640dp")
    fun `wraps the sign-up switch by word in Spanish on a small phone at double font`() {
        drawSignUp()

        assertWrapsByWord("¿Ya tienes cuenta?")
        assertWrapsByWord("Entra")
    }

    @Test
    @Config(qualifiers = "en-w360dp-h640dp")
    fun `wraps the sign-up switch by word with no scaffold on a small phone at double font`() {
        drawSignUp()

        assertWrapsByWord("Already have an account?")
        assertWrapsByWord("Sign in")
    }

    private fun drawSignIn() {
        composeRule.setContent {
            MyGameTheme {
                SignInScreen(state = blankSignIn, onIntent = {}, onSignUpOpen = {}, onForgotPasswordOpen = {})
            }
        }
    }

    private fun drawSignUp() {
        composeRule.setContent {
            MyGameTheme {
                SignUpScreen(state = blankSignUp, onIntent = {}, onSignInOpen = {})
            }
        }
    }

    private fun assertWrapsByWord(text: String) {
        val layout: TextLayoutResult = layoutOf(text)
        val brokenLines: List<Int> = (0 until layout.lineCount - 1).filterNot { line: Int ->
            text[layout.getLineEnd(line) - 1].isWhitespace()
        }
        val lines: List<String> = (0 until layout.lineCount).map { line: Int ->
            text.substring(layout.getLineStart(line), layout.getLineEnd(line))
        }
        assertTrue("\"$text\" breaks mid-word as $lines", brokenLines.isEmpty())
    }

    private fun layoutOf(text: String): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule
            .onNode(hasText(text) and hasTextLayout, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult]
            .action?.invoke(layouts)
        return layouts.first()
    }
}

private val hasTextLayout: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsActions.GetTextLayoutResult)

private val blankSignIn: SignInUiState = SignInUiState.Form(
    email = "",
    password = "",
    status = SignInUiState.FormStatus.Idle,
    isSessionEnded = false,
)

private val blankSignUp: SignUpUiState = SignUpUiState.Form(
    scaffold = PlayerScaffold.Spanish,
    email = "",
    password = "",
    status = SignUpUiState.FormStatus.Idle,
)
