package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.PasswordResetRequestResult
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ForgotPasswordViewModel(private val sessions: SessionRepository) : ViewModel() {

    private val _state: MutableStateFlow<ForgotPasswordUiState> = MutableStateFlow(
        ForgotPasswordUiState.Form(email = "", status = ForgotPasswordUiState.FormStatus.Idle),
    )

    val state: StateFlow<ForgotPasswordUiState> = _state.asStateFlow()

    fun onIntent(intent: ForgotPasswordIntent) {
        when (intent) {
            is ForgotPasswordIntent.EmailChanged -> changeEmail(intent.email)
            ForgotPasswordIntent.SubmitTapped -> submit()
        }
    }

    private fun changeEmail(email: String) {
        _state.update { current: ForgotPasswordUiState ->
            if (current is ForgotPasswordUiState.Form && current.status != ForgotPasswordUiState.FormStatus.Sending) {
                current.copy(email = email)
            } else {
                current
            }
        }
    }

    private fun submit() {
        val form: ForgotPasswordUiState.Form = _state.value as? ForgotPasswordUiState.Form ?: return
        if (form.status == ForgotPasswordUiState.FormStatus.Sending) return
        _state.value = form.copy(status = ForgotPasswordUiState.FormStatus.Sending)
        viewModelScope.launch {
            _state.value = when (sessions.requestPasswordReset(form.email)) {
                PasswordResetRequestResult.Requested -> ForgotPasswordUiState.Sent
                PasswordResetRequestResult.MalformedEmail ->
                    form.copy(status = ForgotPasswordUiState.FormStatus.MalformedEmail)
                PasswordResetRequestResult.Unreachable ->
                    form.copy(status = ForgotPasswordUiState.FormStatus.Unexpected)
            }
        }
    }
}
