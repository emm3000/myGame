package com.emm.mygame.feature.signin

import app.cash.turbine.test
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.VerificationResendResult
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class VerificationBannerViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val unverifiedSession: RestoreResult =
        RestoreResult.SignedIn(SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = false))

    private val verifiedSession: RestoreResult =
        RestoreResult.SignedIn(SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true))

    @Test
    fun `draws the banner while the email is unverified`() = runTest {
        val viewModel: VerificationBannerViewModel = VerificationBannerViewModel(sessions)
        sessions.answerRestore(unverifiedSession)

        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        assertEquals(banner(VerificationBannerUiState.Resend.Idle), viewModel.state.value)
    }

    @Test
    fun `draws no banner once the email is verified`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ScreenHidden)
        sessions.answerRestore(verifiedSession)

        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        assertEquals(VerificationBannerUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `keeps the banner when the session cannot be read again`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ScreenHidden)
        sessions.answerRestore(RestoreResult.Unreachable)

        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        assertEquals(banner(VerificationBannerUiState.Resend.Idle), viewModel.state.value)
    }

    @Test
    fun `draws nothing from a read the screen hid before its answer`() = runTest {
        val viewModel: VerificationBannerViewModel = VerificationBannerViewModel(sessions)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        viewModel.onIntent(VerificationBannerIntent.ScreenHidden)
        sessions.answerRestore(unverifiedSession)

        assertEquals(VerificationBannerUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `marks the resend as waiting while the api answers`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()

        viewModel.onIntent(VerificationBannerIntent.ResendTapped)

        assertEquals(banner(VerificationBannerUiState.Resend.Sending), viewModel.state.value)
    }

    @Test
    fun `drops a second resend while one waits`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)

        viewModel.onIntent(VerificationBannerIntent.ResendTapped)

        assertEquals(1, sessions.resendCount)
    }

    @Test
    fun `draws the sent line after a resend`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()

        viewModel.state.test {
            skipItems(1)
            viewModel.onIntent(VerificationBannerIntent.ResendTapped)
            assertEquals(banner(VerificationBannerUiState.Resend.Sending), awaitItem())
            sessions.answerResend(VerificationResendResult.Sent)
            assertEquals(banner(VerificationBannerUiState.Resend.Sent), awaitItem())
        }
    }

    @Test
    fun `draws the mail-not-sent line on a 503`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)

        sessions.answerResend(VerificationResendResult.MailNotSent)

        assertEquals(banner(VerificationBannerUiState.Resend.MailNotSent), viewModel.state.value)
    }

    @Test
    fun `draws the unreachable line when the resend cannot reach the api`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)

        sessions.answerResend(VerificationResendResult.Unreachable)

        assertEquals(banner(VerificationBannerUiState.Resend.Unreachable), viewModel.state.value)
    }

    @Test
    fun `resends again after a resend the mail server refused`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)
        sessions.answerResend(VerificationResendResult.MailNotSent)

        viewModel.onIntent(VerificationBannerIntent.ResendTapped)

        assertEquals(2, sessions.resendCount)
        assertEquals(banner(VerificationBannerUiState.Resend.Sending), viewModel.state.value)
    }

    @Test
    fun `keeps the sent line when a later read still finds the email unverified`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)
        sessions.answerResend(VerificationResendResult.Sent)
        viewModel.onIntent(VerificationBannerIntent.ScreenHidden)
        sessions.answerRestore(unverifiedSession)

        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        assertEquals(banner(VerificationBannerUiState.Resend.Sent), viewModel.state.value)
    }

    @Test
    fun `draws no banner from a resend answered after the email is verified`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)
        viewModel.onIntent(VerificationBannerIntent.ScreenHidden)
        sessions.answerRestore(verifiedSession)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        sessions.answerResend(VerificationResendResult.Sent)

        assertEquals(VerificationBannerUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `forgets the banner once the session closes`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()

        viewModel.onIntent(VerificationBannerIntent.SessionClosed)

        assertEquals(VerificationBannerUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `drops the answer of a resend the closed session sent`() = runTest {
        val viewModel: VerificationBannerViewModel = shownUnverified()
        viewModel.onIntent(VerificationBannerIntent.ResendTapped)
        viewModel.onIntent(VerificationBannerIntent.ScreenHidden)
        viewModel.onIntent(VerificationBannerIntent.SessionClosed)
        sessions.answerRestore(unverifiedSession)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        sessions.answerResend(VerificationResendResult.Sent)

        assertEquals(banner(VerificationBannerUiState.Resend.Idle), viewModel.state.value)
    }

    @Test
    fun `draws nothing from a read the closed session asked`() = runTest {
        val viewModel: VerificationBannerViewModel = VerificationBannerViewModel(sessions)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)

        viewModel.onIntent(VerificationBannerIntent.SessionClosed)
        sessions.answerRestore(unverifiedSession)

        assertEquals(VerificationBannerUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `keeps one read in flight when the screen is shown twice`() = runTest {
        val viewModel: VerificationBannerViewModel = VerificationBannerViewModel(sessions)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)
        sessions.answerRestore(unverifiedSession)

        sessions.answerRestore(verifiedSession)

        assertEquals(banner(VerificationBannerUiState.Resend.Idle), viewModel.state.value)
    }

    private fun shownUnverified(): VerificationBannerViewModel {
        val viewModel: VerificationBannerViewModel = VerificationBannerViewModel(sessions)
        sessions.answerRestore(unverifiedSession)
        viewModel.onIntent(VerificationBannerIntent.ScreenShown)
        return viewModel
    }

    private fun banner(resend: VerificationBannerUiState.Resend): VerificationBannerUiState =
        VerificationBannerUiState.Unverified(resend = resend)
}
