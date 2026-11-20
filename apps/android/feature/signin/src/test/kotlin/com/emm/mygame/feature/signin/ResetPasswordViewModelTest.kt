package com.emm.mygame.feature.signin

import app.cash.turbine.test
import com.emm.mygame.core.network.PasswordResetResult
import com.emm.mygame.core.network.PasswordResetToken
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ResetPasswordViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val mailedToken: PasswordResetToken = PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn")

    @Test
    fun `opens a mailed link on a blank form`() = runTest {
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(FakeSessionRepository(), mailedToken)

        assertEquals(form(password = "", status = ResetPasswordUiState.FormStatus.Idle), viewModel.state.value)
    }

    @Test
    fun `opens a link without a token on the refused link`() = runTest {
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(FakeSessionRepository(), token = null)

        assertEquals(ResetPasswordUiState.LinkRefused, viewModel.state.value)
    }

    @Test
    fun `sends nothing for a link without a token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, token = null)

        typeAndSubmit(viewModel, password = "hierro-y-lana")

        assertEquals(emptyList<FakeSessionRepository.PasswordReset>(), sessions.passwordResets)
    }

    @Test
    fun `sends the mailed token with the password the player typed`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)

        typeAndSubmit(viewModel, password = "hierro-y-lana")

        assertEquals(
            listOf(FakeSessionRepository.PasswordReset(token = mailedToken, password = "hierro-y-lana")),
            sessions.passwordResets,
        )
    }

    @Test
    fun `sends a short password without checking its length`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)

        typeAndSubmit(viewModel, password = "corta")

        assertEquals(
            listOf(FakeSessionRepository.PasswordReset(token = mailedToken, password = "corta")),
            sessions.passwordResets,
        )
    }

    @Test
    fun `drops a second tap while the change waits`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)
        typeAndSubmit(viewModel, password = "hierro-y-lana")

        viewModel.onIntent(ResetPasswordIntent.SubmitTapped)

        assertEquals(1, sessions.passwordResets.size)
    }

    @Test
    fun `marks the form sending while the api answers`() = runTest {
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(FakeSessionRepository(), mailedToken)

        typeAndSubmit(viewModel, password = "hierro-y-lana")

        assertEquals(
            form(password = "hierro-y-lana", status = ResetPasswordUiState.FormStatus.Sending),
            viewModel.state.value,
        )
    }

    @Test
    fun `shows the changed password once the api replaces it`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)
        typeAndSubmit(viewModel, password = "hierro-y-lana")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordChange(PasswordResetResult.Changed)
            assertEquals(ResetPasswordUiState.Changed, awaitItem())
        }
    }

    @Test
    fun `shows the refused link when the api refuses the token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)
        typeAndSubmit(viewModel, password = "hierro-y-lana")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordChange(PasswordResetResult.LinkRefused)
            assertEquals(ResetPasswordUiState.LinkRefused, awaitItem())
        }
    }

    @Test
    fun `keeps the form with the weak password line when the api refuses the password`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)
        typeAndSubmit(viewModel, password = "corta")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordChange(PasswordResetResult.WeakPassword)
            assertEquals(form(password = "corta", status = ResetPasswordUiState.FormStatus.WeakPassword), awaitItem())
        }
    }

    @Test
    fun `keeps the form with the unexpected line when the api cannot be reached`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: ResetPasswordViewModel = ResetPasswordViewModel(sessions, mailedToken)
        typeAndSubmit(viewModel, password = "hierro-y-lana")

        viewModel.state.test {
            skipItems(1)
            sessions.answerPasswordChange(PasswordResetResult.Unreachable)
            assertEquals(
                form(password = "hierro-y-lana", status = ResetPasswordUiState.FormStatus.Unexpected),
                awaitItem(),
            )
        }
    }

    private fun typeAndSubmit(viewModel: ResetPasswordViewModel, password: String) {
        viewModel.onIntent(ResetPasswordIntent.PasswordChanged(password))
        viewModel.onIntent(ResetPasswordIntent.SubmitTapped)
    }

    private fun form(password: String, status: ResetPasswordUiState.FormStatus): ResetPasswordUiState.Form =
        ResetPasswordUiState.Form(password = password, status = status)
}
