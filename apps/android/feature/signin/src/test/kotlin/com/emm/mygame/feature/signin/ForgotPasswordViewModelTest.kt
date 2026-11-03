package com.emm.mygame.feature.signin

import app.cash.turbine.test
import com.emm.mygame.core.network.PasswordResetRequestResult
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ForgotPasswordViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `opens on a blank form`() = runTest {
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(FakeSessionRepository())

        assertEquals(form(email = "", status = ForgotPasswordUiState.FormStatus.Idle), viewModel.state.value)
    }

    @Test
    fun `asks for the reset link of the email the player typed`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)

        typeAndSubmit(viewModel, email = "ines@sotoverde.es")

        assertEquals(listOf("ines@sotoverde.es"), sessions.passwordResetEmails)
    }

    @Test
    fun `sends the email as typed without checking its shape`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)

        typeAndSubmit(viewModel, email = "ines")

        assertEquals(listOf("ines"), sessions.passwordResetEmails)
    }

    @Test
    fun `drops a second tap while the request waits`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)
        typeAndSubmit(viewModel, email = "ines@sotoverde.es")

        viewModel.onIntent(ForgotPasswordIntent.SubmitTapped)

        assertEquals(listOf("ines@sotoverde.es"), sessions.passwordResetEmails)
    }

    @Test
    fun `marks the form sending while the api answers`() = runTest {
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(FakeSessionRepository())

        typeAndSubmit(viewModel, email = "ines@sotoverde.es")

        assertEquals(
            form(email = "ines@sotoverde.es", status = ForgotPasswordUiState.FormStatus.Sending),
            viewModel.state.value,
        )
    }

    @Test
    fun `replaces the form with the confirmation once the api accepts the request`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)
        typeAndSubmit(viewModel, email = "ines@sotoverde.es")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordReset(PasswordResetRequestResult.Requested)
            assertEquals(ForgotPasswordUiState.Sent, awaitItem())
        }
    }

    @Test
    fun `keeps the form with the malformed email line when the api answers 400`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)
        typeAndSubmit(viewModel, email = "ines")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordReset(PasswordResetRequestResult.MalformedEmail)
            assertEquals(form(email = "ines", status = ForgotPasswordUiState.FormStatus.MalformedEmail), awaitItem())
        }
    }

    @Test
    fun `keeps the form with the unexpected line when the api cannot be reached`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)
        typeAndSubmit(viewModel, email = "ines@sotoverde.es")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordReset(PasswordResetRequestResult.Unreachable)
            assertEquals(
                form(email = "ines@sotoverde.es", status = ForgotPasswordUiState.FormStatus.Unexpected),
                awaitItem(),
            )
        }
    }

    @Test
    fun `asks again after the unexpected line`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ForgotPasswordViewModel = ForgotPasswordViewModel(sessions)
        typeAndSubmit(viewModel, email = "ines@sotoverde.es")
        sessions.answerPasswordReset(PasswordResetRequestResult.Unreachable)

        viewModel.onIntent(ForgotPasswordIntent.SubmitTapped)

        assertEquals(listOf("ines@sotoverde.es", "ines@sotoverde.es"), sessions.passwordResetEmails)
    }

    private fun typeAndSubmit(viewModel: ForgotPasswordViewModel, email: String) {
        viewModel.onIntent(ForgotPasswordIntent.EmailChanged(email))
        viewModel.onIntent(ForgotPasswordIntent.SubmitTapped)
    }

    private fun form(email: String, status: ForgotPasswordUiState.FormStatus): ForgotPasswordUiState.Form =
        ForgotPasswordUiState.Form(email = email, status = status)
}
