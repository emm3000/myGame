package com.emm.mygame.feature.account.verification

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.account.EmailVerificationResult
import com.emm.mygame.core.model.account.EmailVerificationToken
import com.emm.mygame.core.model.account.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class VerifyEmailViewModel(
    private val sessions: SessionRepository,
    private val savedState: SavedStateHandle,
    private val token: EmailVerificationToken?,
) : ViewModel() {

    private val settledState: VerifyEmailUiState? = settledStateOf(savedState.get<SettledAnswer>(SETTLED_ANSWER))

    private val _state: MutableStateFlow<VerifyEmailUiState> =
        MutableStateFlow(settledState ?: VerifyEmailUiState.LinkRefused)

    val state: StateFlow<VerifyEmailUiState> = _state.asStateFlow()

    init {
        if (settledState == null) verify()
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
            val answer: EmailVerificationResult = sessions.verifyEmail(mailed)
            savedState[SETTLED_ANSWER] = settledAnswerOf(answer)
            _state.value = stateOf(answer)
        }
    }
}

private const val SETTLED_ANSWER: String = "settledAnswer"

private enum class SettledAnswer { Verified, LinkRefused }

private fun settledAnswerOf(answer: EmailVerificationResult): SettledAnswer? = when (answer) {
    EmailVerificationResult.Verified -> SettledAnswer.Verified
    EmailVerificationResult.LinkRefused -> SettledAnswer.LinkRefused
    EmailVerificationResult.Unreachable -> null
}

private fun settledStateOf(settledAnswer: SettledAnswer?): VerifyEmailUiState? = when (settledAnswer) {
    SettledAnswer.Verified -> VerifyEmailUiState.Verified
    SettledAnswer.LinkRefused -> VerifyEmailUiState.LinkRefused
    null -> null
}

private fun stateOf(answer: EmailVerificationResult): VerifyEmailUiState = when (answer) {
    EmailVerificationResult.Verified -> VerifyEmailUiState.Verified
    EmailVerificationResult.LinkRefused -> VerifyEmailUiState.LinkRefused
    EmailVerificationResult.Unreachable -> VerifyEmailUiState.Unexpected
}
