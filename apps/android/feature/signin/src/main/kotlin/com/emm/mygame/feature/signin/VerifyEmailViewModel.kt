package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.EmailVerificationResult
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class VerifyEmailViewModel(
    private val sessions: SessionRepository,
    private val token: EmailVerificationToken?,
) : ViewModel() {

    private val _state: MutableStateFlow<VerifyEmailUiState> = MutableStateFlow(VerifyEmailUiState.LinkRefused)

    val state: StateFlow<VerifyEmailUiState> = _state.asStateFlow()

    init {
        verify()
    }

    fun onIntent(intent: VerifyEmailIntent) {
        when (intent) {
            VerifyEmailIntent.RetryTapped -> retry()
        }
    }

    private fun retry() {
        if (_state.value != VerifyEmailUiState.Unexpected) return
        verify()
    }

    private fun verify() {
        val mailed: EmailVerificationToken = token ?: return
        _state.value = VerifyEmailUiState.Verifying
        viewModelScope.launch {
            _state.value = stateOf(sessions.verifyEmail(mailed))
        }
    }
}

private fun stateOf(answer: EmailVerificationResult): VerifyEmailUiState = when (answer) {
    EmailVerificationResult.Verified -> VerifyEmailUiState.Verified
    EmailVerificationResult.LinkRefused -> VerifyEmailUiState.LinkRefused
    EmailVerificationResult.Unreachable -> VerifyEmailUiState.Unexpected
}
