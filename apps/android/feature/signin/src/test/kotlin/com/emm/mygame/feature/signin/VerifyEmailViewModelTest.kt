package com.emm.mygame.feature.signin

import app.cash.turbine.test
import com.emm.mygame.core.network.EmailVerificationResult
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class VerifyEmailViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val mailedToken: EmailVerificationToken = EmailVerificationToken("iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y")

    @Test
    fun `sends the mailed token once on open`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Verified)

        VerifyEmailViewModel(sessions, mailedToken)

        assertEquals(listOf(mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `shows the verifying line while the api has not answered`() = runTest {
        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(FakeSessionRepository(), mailedToken)

        assertEquals(VerifyEmailUiState.Verifying, viewModel.state.value)
    }

    @Test
    fun `shows the verified state when the api confirms the email`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Verified)

        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(sessions, mailedToken)

        assertEquals(VerifyEmailUiState.Verified, viewModel.state.value)
    }

    @Test
    fun `shows the refused link when the api refuses the token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)

        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(sessions, mailedToken)

        assertEquals(VerifyEmailUiState.LinkRefused, viewModel.state.value)
    }

    @Test
    fun `shows the refused link for a link without a token`() = runTest {
        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(FakeSessionRepository(), token = null)

        assertEquals(VerifyEmailUiState.LinkRefused, viewModel.state.value)
    }

    @Test
    fun `sends nothing for a link without a token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()

        VerifyEmailViewModel(sessions, token = null)

        assertEquals(emptyList<EmailVerificationToken>(), sessions.emailVerifications)
    }

    @Test
    fun `shows the unexpected line when the api cannot be reached`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Unreachable)

        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(sessions, mailedToken)

        assertEquals(VerifyEmailUiState.Unexpected, viewModel.state.value)
    }

    @Test
    fun `sends the mailed token again on a retry after the unexpected line`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Unreachable)
        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(sessions, mailedToken)

        viewModel.onIntent(VerifyEmailIntent.RetryTapped)

        assertEquals(listOf(mailedToken, mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `shows the verifying line and then the verified state on a retry the api confirms`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Unreachable)
        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(sessions, mailedToken)

        viewModel.state.test {
            assertEquals(VerifyEmailUiState.Unexpected, awaitItem())
            viewModel.onIntent(VerifyEmailIntent.RetryTapped)
            assertEquals(VerifyEmailUiState.Verifying, awaitItem())
            sessions.answerEmailVerification(EmailVerificationResult.Verified)
            assertEquals(VerifyEmailUiState.Verified, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `sends nothing on a retry while the token is still being sent`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: VerifyEmailViewModel = VerifyEmailViewModel(sessions, mailedToken)

        viewModel.onIntent(VerifyEmailIntent.RetryTapped)

        assertEquals(listOf(mailedToken), sessions.emailVerifications)
    }
}
