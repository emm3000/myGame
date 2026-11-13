package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.AnnotatedString
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RefusalKind
import com.emm.mygame.core.network.SignUpRefusal
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val TAGLINE: String = "Aprende inglés mientras tu pueblo crece."
private val medievalWord: Regex = Regex("feudo|vadoalto|señor|reino", RegexOption.IGNORE_CASE)

@RunWith(RobolectricTestRunner::class)
class AccountScreensTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `says what the game is on sign-up and sign-in`() {
        val shown: MutableState<@Composable () -> Unit> = mutableStateOf(signUp(SignUpUiState.FormStatus.Idle))
        composeRule.setContent { MyGameTheme { shown.value() } }

        composeRule.onNodeWithText(TAGLINE).assertIsDisplayed()
        shown.value = signInForm(SignInUiState.FormStatus.Idle)
        composeRule.onNodeWithText(TAGLINE).assertIsDisplayed()
    }

    @Test
    fun `uses no medieval word on the account screens`() {
        val screens: List<@Composable () -> Unit> = listOf(
            signIn(SignInUiState.CheckingSession),
            signInForm(SignInUiState.FormStatus.Idle, isSessionEnded = true),
            signInForm(SignInUiState.FormStatus.Refused(RefusalKind.InvalidCredentials)),
            signInForm(SignInUiState.FormStatus.Unreachable(SignInUiState.Attempt.SignIn)),
            signUp(SignUpUiState.FormStatus.Refused(SignUpRefusal.EmailTaken)),
            signUp(SignUpUiState.FormStatus.Unreachable),
            forgotPassword(ForgotPasswordUiState.Form(email = "", status = ForgotPasswordUiState.FormStatus.Idle)),
            forgotPassword(ForgotPasswordUiState.Sent),
        )
        val shown: MutableState<@Composable () -> Unit> = mutableStateOf(screens.first())
        composeRule.setContent { MyGameTheme { shown.value() } }

        val medievalLines: List<String> = screens.flatMap { screen: @Composable () -> Unit ->
            shown.value = screen
            linesOnScreen().filter { line: String -> medievalWord.containsMatchIn(line) }
        }

        assertEquals(emptyList<String>(), medievalLines.distinct())
    }

    private fun linesOnScreen(): List<String> =
        composeRule.onAllNodes(SemanticsMatcher("any node") { true }, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .flatMap(::linesOf)

    private fun linesOf(node: SemanticsNode): List<String> =
        node.config.getOrNull(SemanticsProperties.Text).orEmpty().map(AnnotatedString::text) +
            node.config.getOrNull(SemanticsProperties.ContentDescription).orEmpty() +
            listOfNotNull(node.config.getOrNull(SemanticsProperties.EditableText)?.text)

    private fun signInForm(
        status: SignInUiState.FormStatus,
        isSessionEnded: Boolean = false,
    ): @Composable () -> Unit =
        signIn(SignInUiState.Form(email = "", password = "", status = status, isSessionEnded = isSessionEnded))

    private fun signIn(state: SignInUiState): @Composable () -> Unit = {
        SignInScreen(state = state, onIntent = {}, onSignUpOpen = {}, onForgotPasswordOpen = {})
    }

    private fun signUp(status: SignUpUiState.FormStatus): @Composable () -> Unit = {
        SignUpScreen(
            state = SignUpUiState.Form(scaffold = PlayerScaffold.Spanish, email = "", password = "", status = status),
            onIntent = {},
            onSignInOpen = {},
        )
    }

    private fun forgotPassword(state: ForgotPasswordUiState): @Composable () -> Unit = {
        ForgotPasswordScreen(state = state, onIntent = {}, onSignInOpen = {})
    }
}
