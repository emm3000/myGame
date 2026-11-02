package com.emm.mygame.feature.signin

import app.cash.turbine.test
import com.emm.mygame.core.network.SignUpRefusal
import com.emm.mygame.core.network.SignUpResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class SignUpViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val elena: SignedInPlayer = SignedInPlayer(email = "elena@encinar.es")

    @Test
    fun `opens on a blank form`() = runTest {
        val viewModel: SignUpViewModel = SignUpViewModel(FakeSessionRepository())

        assertEquals(blankForm(), viewModel.state.value)
    }

    @Test
    fun `marks the form submitting while the api answers`() = runTest {
        val viewModel: SignUpViewModel = SignUpViewModel(FakeSessionRepository())

        viewModel.state.test {
            skipItems(1)
            fillAndSubmit(viewModel)
            skipItems(FILLED_FIELDS)
            assertEquals(filledForm(SignUpUiState.FormStatus.Submitting), awaitItem())
        }
    }

    @Test
    fun `sends the email, password and fief name the player typed`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)

        fillAndSubmit(viewModel)

        assertEquals(
            listOf(
                FakeSessionRepository.SignUpAttempt(
                    email = "elena@encinar.es",
                    password = "hierro-y-lana",
                    fiefName = "Encinar",
                ),
            ),
            sessions.signUpAttempts,
        )
    }

    @Test
    fun `opens the fief after an account is created`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)

        viewModel.effects.test {
            sessions.answerSignUp(SignUpResult.SignedIn(elena))
            assertEquals(SignUpEffect.SignedIn, awaitItem())
        }
    }

    @Test
    fun `shows the refusal the api names`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)

        viewModel.state.test {
            skipItems(1)
            sessions.answerSignUp(SignUpResult.Refused(SignUpRefusal.EmailTaken))
            assertEquals(filledForm(SignUpUiState.FormStatus.Refused(SignUpRefusal.EmailTaken)), awaitItem())
        }
    }

    @Test
    fun `offers a retry when the sign-up cannot reach the api`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)

        viewModel.state.test {
            skipItems(1)
            sessions.answerSignUp(SignUpResult.Unreachable)
            assertEquals(filledForm(SignUpUiState.FormStatus.Unreachable), awaitItem())
        }
    }

    @Test
    fun `sends the sign-up again on retry`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)
        sessions.answerSignUp(SignUpResult.Unreachable)

        viewModel.onIntent(SignUpIntent.RetryTapped)

        assertEquals(2, sessions.signUpAttempts.size)
        assertEquals(filledForm(SignUpUiState.FormStatus.Submitting), viewModel.state.value)
    }

    @Test
    fun `ignores a second submit while the first is in flight`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)

        viewModel.onIntent(SignUpIntent.SubmitTapped)

        assertEquals(1, sessions.signUpAttempts.size)
    }

    @Test
    fun `keeps the typed fields while the sign-up is in flight`() = runTest {
        val viewModel: SignUpViewModel = SignUpViewModel(FakeSessionRepository())
        fillAndSubmit(viewModel)

        viewModel.onIntent(SignUpIntent.FiefNameChanged("Pinares"))

        assertEquals(filledForm(SignUpUiState.FormStatus.Submitting), viewModel.state.value)
    }

    @Test
    fun `does not send again on retry after the api refused`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)
        sessions.answerSignUp(SignUpResult.Refused(SignUpRefusal.WeakPassword))

        viewModel.onIntent(SignUpIntent.RetryTapped)

        assertEquals(1, sessions.signUpAttempts.size)
        assertEquals(filledForm(SignUpUiState.FormStatus.Refused(SignUpRefusal.WeakPassword)), viewModel.state.value)
    }

    @Test
    fun `keeps the player on sign-up while the sign-up is in flight`() = runTest {
        val viewModel: SignUpViewModel = SignUpViewModel(FakeSessionRepository())

        fillAndSubmit(viewModel)

        assertFalse(viewModel.state.value.canSwitchToSignIn)
    }

    @Test
    fun `lets the player switch to sign-in once the api has answered`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: SignUpViewModel = SignUpViewModel(sessions)
        fillAndSubmit(viewModel)

        sessions.answerSignUp(SignUpResult.Refused(SignUpRefusal.EmailTaken))

        assertTrue(viewModel.state.value.canSwitchToSignIn)
    }

    private fun fillAndSubmit(viewModel: SignUpViewModel) {
        viewModel.onIntent(SignUpIntent.EmailChanged("elena@encinar.es"))
        viewModel.onIntent(SignUpIntent.PasswordChanged("hierro-y-lana"))
        viewModel.onIntent(SignUpIntent.FiefNameChanged("Encinar"))
        viewModel.onIntent(SignUpIntent.SubmitTapped)
    }

    private fun blankForm(): SignUpUiState =
        SignUpUiState.Form(email = "", password = "", fiefName = "", status = SignUpUiState.FormStatus.Idle)

    private fun filledForm(status: SignUpUiState.FormStatus): SignUpUiState = SignUpUiState.Form(
        email = "elena@encinar.es",
        password = "hierro-y-lana",
        fiefName = "Encinar",
        status = status,
    )

    private companion object {
        const val FILLED_FIELDS: Int = 3
    }
}
