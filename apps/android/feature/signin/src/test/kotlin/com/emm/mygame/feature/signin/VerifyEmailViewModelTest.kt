package com.emm.mygame.feature.signin

import androidx.lifecycle.SavedStateHandle
import app.cash.turbine.test
import com.emm.mygame.core.network.EmailVerificationResult
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
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

        verifyEmailViewModel(sessions, mailedToken)

        assertEquals(listOf(mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `shows the verifying line while the api has not answered`() = runTest {
        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(FakeSessionRepository(), mailedToken)

        assertEquals(VerifyEmailUiState.Verifying, viewModel.state.value)
    }

    @Test
    fun `shows the verified state when the api confirms the email`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Verified)

        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken)

        assertEquals(VerifyEmailUiState.Verified, viewModel.state.value)
    }

    @Test
    fun `shows the refused link when the api refuses the token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)

        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken)

        assertEquals(VerifyEmailUiState.LinkRefused, viewModel.state.value)
    }

    @Test
    fun `shows the refused link for a link without a token`() = runTest {
        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(FakeSessionRepository(), token = null)

        assertEquals(VerifyEmailUiState.LinkRefused, viewModel.state.value)
    }

    @Test
    fun `sends nothing for a link without a token`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()

        verifyEmailViewModel(sessions, token = null)

        assertEquals(emptyList<EmailVerificationToken>(), sessions.emailVerifications)
    }

    @Test
    fun `shows the unexpected line when the api cannot be reached`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Unreachable)

        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken)

        assertEquals(VerifyEmailUiState.Unexpected, viewModel.state.value)
    }

    @Test
    fun `sends the mailed token again on a retry after the unexpected line`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Unreachable)
        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken)

        viewModel.onIntent(VerifyEmailIntent.RetryTapped)

        assertEquals(listOf(mailedToken, mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `shows the verifying line and then the verified state on a retry the api confirms`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        sessions.answerEmailVerification(EmailVerificationResult.Unreachable)
        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken)

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
        val viewModel: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken)

        viewModel.onIntent(VerifyEmailIntent.RetryTapped)

        assertEquals(listOf(mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `shows the verified state when restored after a verified answer`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val verifiedState: SavedStateHandle = savedStateAfter(EmailVerificationResult.Verified, sessions)
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)

        val restored: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken, verifiedState)

        assertEquals(VerifyEmailUiState.Verified, restored.state.value)
    }

    @Test
    fun `sends no second token when restored after a verified answer`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val verifiedState: SavedStateHandle = savedStateAfter(EmailVerificationResult.Verified, sessions)
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)

        verifyEmailViewModel(sessions, mailedToken, verifiedState)

        assertEquals(listOf(mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `sends the mailed token again when restored after an unexpected answer`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val unexpectedState: SavedStateHandle = savedStateAfter(EmailVerificationResult.Unreachable, sessions)
        sessions.answerEmailVerification(EmailVerificationResult.Verified)

        verifyEmailViewModel(sessions, mailedToken, unexpectedState)

        assertEquals(listOf(mailedToken, mailedToken), sessions.emailVerifications)
    }

    @Test
    fun `shows the verified state when a restored resend is refused while the session email is verified`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val inFlightState: SavedStateHandle = savedStateWhileSending()
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)
        sessions.answerRestore(RestoreResult.SignedIn(signedInPlayer(isEmailVerified = true)))

        val restored: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken, inFlightState)

        assertEquals(VerifyEmailUiState.Verified, restored.state.value)
    }

    @Test
    fun `shows the refused link when a restored resend is refused while the session email is unverified`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val inFlightState: SavedStateHandle = savedStateWhileSending()
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)
        sessions.answerRestore(RestoreResult.SignedIn(signedInPlayer(isEmailVerified = false)))

        val restored: VerifyEmailViewModel = verifyEmailViewModel(sessions, mailedToken, inFlightState)

        assertEquals(VerifyEmailUiState.LinkRefused, restored.state.value)
    }

    @Test
    fun `sends no third token when restored again after the session confirmed the email`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val restoredState: SavedStateHandle = savedStateWhileSending()
        sessions.answerEmailVerification(EmailVerificationResult.LinkRefused)
        sessions.answerRestore(RestoreResult.SignedIn(signedInPlayer(isEmailVerified = true)))
        verifyEmailViewModel(sessions, mailedToken, restoredState)
        val confirmedState: SavedStateHandle = copyOf(restoredState)

        verifyEmailViewModel(sessions, mailedToken, confirmedState)

        assertEquals(listOf(mailedToken), sessions.emailVerifications)
    }

    private fun savedStateAfter(answer: EmailVerificationResult, sessions: FakeSessionRepository): SavedStateHandle {
        sessions.answerEmailVerification(answer)
        val savedState: SavedStateHandle = SavedStateHandle()
        verifyEmailViewModel(sessions, mailedToken, savedState)
        return copyOf(savedState)
    }

    private fun savedStateWhileSending(): SavedStateHandle {
        val savedState: SavedStateHandle = SavedStateHandle()
        verifyEmailViewModel(FakeSessionRepository(), mailedToken, savedState)
        return copyOf(savedState)
    }

    private fun copyOf(savedState: SavedStateHandle): SavedStateHandle =
        SavedStateHandle(savedState.keys().associateWith { key -> savedState.get<Any>(key) })

    private fun signedInPlayer(isEmailVerified: Boolean): SignedInPlayer =
        SignedInPlayer(email = "player@example.com", isEmailVerified = isEmailVerified, scaffold = null)

    private fun verifyEmailViewModel(
        sessions: FakeSessionRepository,
        token: EmailVerificationToken?,
        savedState: SavedStateHandle = SavedStateHandle(),
    ): VerifyEmailViewModel = VerifyEmailViewModel(sessions = sessions, savedState = savedState, token = token)
}
