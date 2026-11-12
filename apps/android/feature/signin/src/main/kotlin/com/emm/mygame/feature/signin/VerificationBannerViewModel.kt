package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.VerificationResendResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class VerificationBannerViewModel(private val sessions: SessionRepository) : ViewModel() {

    private val _state: MutableStateFlow<VerificationBannerUiState> =
        MutableStateFlow(VerificationBannerUiState.Hidden)

    val state: StateFlow<VerificationBannerUiState> = _state.asStateFlow()

    private var reading: Job? = null

    private var resending: Job? = null

    fun onIntent(intent: VerificationBannerIntent) {
        when (intent) {
            VerificationBannerIntent.ScreenShown -> read()
            VerificationBannerIntent.ScreenHidden -> reading?.cancel()
            VerificationBannerIntent.ResendTapped -> resend()
            VerificationBannerIntent.SessionClosed -> close()
        }
    }

    private fun read() {
        reading?.cancel()
        reading = viewModelScope.launch {
            when (val answer: RestoreResult = sessions.restore()) {
                is RestoreResult.SignedIn -> drawSession(answer.player)
                RestoreResult.SignedOut, RestoreResult.Unreachable -> Unit
            }
        }
    }

    private fun resend() {
        if (resending?.isActive == true) return
        resending = viewModelScope.launch {
            showResend(VerificationBannerUiState.Resend.Sending)
            showResend(outcomeOf(sessions.resendVerification()))
        }
    }

    private fun showResend(resend: VerificationBannerUiState.Resend) {
        _state.update { current: VerificationBannerUiState ->
            if (current is VerificationBannerUiState.Unverified) current.copy(resend = resend) else current
        }
    }

    private fun close() {
        reading?.cancel()
        resending?.cancel()
        _state.value = VerificationBannerUiState.Hidden
    }

    private fun drawSession(player: SignedInPlayer) {
        _state.update { current: VerificationBannerUiState ->
            when {
                player.isEmailVerified -> VerificationBannerUiState.Hidden
                current is VerificationBannerUiState.Unverified -> current
                else -> VerificationBannerUiState.Unverified(resend = VerificationBannerUiState.Resend.Idle)
            }
        }
    }
}

private fun outcomeOf(answer: VerificationResendResult): VerificationBannerUiState.Resend = when (answer) {
    VerificationResendResult.Sent -> VerificationBannerUiState.Resend.Sent
    VerificationResendResult.MailNotSent -> VerificationBannerUiState.Resend.MailNotSent
    VerificationResendResult.Unreachable -> VerificationBannerUiState.Resend.Unreachable
}
