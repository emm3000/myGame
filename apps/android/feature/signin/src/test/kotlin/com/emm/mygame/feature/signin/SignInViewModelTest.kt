package com.emm.mygame.feature.signin

import app.cash.turbine.ReceiveTurbine
import app.cash.turbine.test
import com.emm.mygame.core.network.RefusalKind
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignInResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class SignInViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val ines: SignedInPlayer = SignedInPlayer(email = "ines@sotoverde.es")

    @Test
    fun `checks the stored session at launch`() = runTest {
        val viewModel: SignInViewModel = SignInViewModel(FakeSessionRepository(), isSessionEnded = false)

        assertEquals(SignInUiState.CheckingSession, viewModel.state.value)
    }

    @Test
    fun `opens the town when the stored token's session answers`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = SignInViewModel(sessions, isSessionEnded = false)

        viewModel.effects.test {
            sessions.answerRestore(RestoreResult.SignedIn(ines))
            assertEquals(SignInEffect.SignedIn, awaitItem())
        }
    }

    @Test
    fun `returns to sign-in when the api refuses the stored token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = SignInViewModel(sessions, isSessionEnded = false)

        viewModel.state.test {
            assertEquals(SignInUiState.CheckingSession, awaitItem())
            sessions.answerRestore(RestoreResult.SignedOut)
            assertEquals(blankForm(SignInUiState.FormStatus.Idle), awaitItem())
        }
    }

    @Test
    fun `offers a retry when the session check cannot reach the api`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = SignInViewModel(sessions, isSessionEnded = false)

        viewModel.state.test {
            skipItems(1)
            sessions.answerRestore(RestoreResult.Unreachable)
            assertEquals(
                blankForm(SignInUiState.FormStatus.Unreachable(SignInUiState.Attempt.SessionCheck)),
                awaitItem(),
            )
        }
    }

    @Test
    fun `checks the stored session again on retry`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = SignInViewModel(sessions, isSessionEnded = false)
        sessions.answerRestore(RestoreResult.Unreachable)

        viewModel.state.test {
            skipItems(1)
            viewModel.onIntent(SignInIntent.RetryTapped)
            assertEquals(SignInUiState.CheckingSession, awaitItem())
        }
        viewModel.effects.test {
            sessions.answerRestore(RestoreResult.SignedIn(ines))
            assertEquals(SignInEffect.SignedIn, awaitItem())
        }
    }

    @Test
    fun `marks the form submitting while the api answers`() = runTest {
        val viewModel: SignInViewModel = signedOutViewModel(FakeSessionRepository())

        viewModel.state.test {
            skipItems(1)
            fillAndSubmit(viewModel)
            assertEquals(filledForm(SignInUiState.FormStatus.Submitting), awaitFormStatusChange())
        }
    }

    @Test
    fun `sends the email and password the player typed`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)

        fillAndSubmit(viewModel)

        assertEquals(
            listOf(FakeSessionRepository.SignInAttempt(email = "ines@sotoverde.es", password = "contrasena")),
            sessions.signInAttempts,
        )
    }

    @Test
    fun `shows the refusal the api names`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)

        sessions.answerSignIn(SignInResult.Refused(RefusalKind.InvalidCredentials))

        assertEquals(
            filledForm(SignInUiState.FormStatus.Refused(RefusalKind.InvalidCredentials)),
            viewModel.state.value,
        )
    }

    @Test
    fun `opens the town when the api accepts the credentials`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)

        viewModel.effects.test {
            sessions.answerSignIn(SignInResult.SignedIn(ines))
            assertEquals(SignInEffect.SignedIn, awaitItem())
        }
    }

    @Test
    fun `keeps the form busy once the api accepts the credentials`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)

        sessions.answerSignIn(SignInResult.SignedIn(ines))

        assertEquals(filledForm(SignInUiState.FormStatus.Submitting), viewModel.state.value)
    }

    @Test
    fun `offers a retry when the sign-in cannot reach the api`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)

        sessions.answerSignIn(SignInResult.Unreachable)

        assertEquals(
            filledForm(SignInUiState.FormStatus.Unreachable(SignInUiState.Attempt.SignIn)),
            viewModel.state.value,
        )
    }

    @Test
    fun `sends the sign-in again on retry`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)
        sessions.answerSignIn(SignInResult.Unreachable)

        viewModel.onIntent(SignInIntent.RetryTapped)

        assertEquals(2, sessions.signInAttempts.size)
    }

    @Test
    fun `ignores a second submit while the first is in flight`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)

        viewModel.onIntent(SignInIntent.SubmitTapped)

        assertEquals(1, sessions.signInAttempts.size)
    }

    @Test
    fun `keeps the player on sign-in while the sign-in is in flight`() = runTest {
        val viewModel: SignInViewModel = signedOutViewModel(FakeSessionRepository())

        fillAndSubmit(viewModel)

        assertFalse(viewModel.state.value.canSwitchToSignUp)
    }

    @Test
    fun `lets the player switch to sign-up once the api has answered`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignInViewModel = signedOutViewModel(sessions)
        fillAndSubmit(viewModel)

        sessions.answerSignIn(SignInResult.Refused(RefusalKind.InvalidCredentials))

        assertTrue(viewModel.state.value.canSwitchToSignUp)
    }

    @Test
    fun `shows the session-ended line when sign-in follows an ended session`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerRestore(RestoreResult.SignedOut)

        val viewModel: SignInViewModel = SignInViewModel(sessions, isSessionEnded = true)

        assertTrue((viewModel.state.value as SignInUiState.Form).isSessionEnded)
    }

    @Test
    fun `shows no session-ended line on a sign-in no ended session led to`() = runTest {
        val viewModel: SignInViewModel = signedOutViewModel(FakeSessionRepository())

        assertFalse((viewModel.state.value as SignInUiState.Form).isSessionEnded)
    }

    @Test
    fun `drops the session-ended line once the player submits`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerRestore(RestoreResult.SignedOut)
        val viewModel: SignInViewModel = SignInViewModel(sessions, isSessionEnded = true)

        fillAndSubmit(viewModel)
        sessions.answerSignIn(SignInResult.Refused(RefusalKind.InvalidCredentials))

        assertFalse((viewModel.state.value as SignInUiState.Form).isSessionEnded)
    }

    private fun signedOutViewModel(sessions: FakeSessionRepository): SignInViewModel {
        sessions.answerRestore(RestoreResult.SignedOut)
        return SignInViewModel(sessions, isSessionEnded = false)
    }

    private fun fillAndSubmit(viewModel: SignInViewModel) {
        viewModel.onIntent(SignInIntent.EmailChanged("ines@sotoverde.es"))
        viewModel.onIntent(SignInIntent.PasswordChanged("contrasena"))
        viewModel.onIntent(SignInIntent.SubmitTapped)
    }

    private suspend fun ReceiveTurbine<SignInUiState>.awaitFormStatusChange(): SignInUiState {
        skipItems(2)
        return awaitItem()
    }

    private fun blankForm(status: SignInUiState.FormStatus): SignInUiState =
        SignInUiState.Form(email = "", password = "", status = status, isSessionEnded = false)

    private fun filledForm(status: SignInUiState.FormStatus): SignInUiState =
        SignInUiState.Form(
            email = "ines@sotoverde.es",
            password = "contrasena",
            status = status,
            isSessionEnded = false,
        )
}
