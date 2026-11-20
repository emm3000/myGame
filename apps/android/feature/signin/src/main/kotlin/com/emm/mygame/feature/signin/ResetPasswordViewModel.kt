package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.PasswordResetResult
import com.emm.mygame.core.network.PasswordResetToken
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ResetPasswordViewModel(
    private val sessions: SessionRepository,
    private val token: PasswordResetToken?,
) : ViewModel() {

    private val _state: MutableStateFlow<ResetPasswordUiState> = MutableStateFlow(openingStateOf(token))

    val state: StateFlow<ResetPasswordUiState> = _state.asStateFlow()

    fun onIntent(intent: ResetPasswordIntent) {
        when (intent) {
            is ResetPasswordIntent.PasswordChanged -> changePassword(intent.password)
            ResetPasswordIntent.SubmitTapped -> submit()
        }
    }

    private fun changePassword(password: String) {
        _state.update { current: ResetPasswordUiState ->
            if (current is ResetPasswordUiState.Form && current.status != ResetPasswordUiState.FormStatus.Sending) {
                current.copy(password = password)
            } else {
                current
            }
        }
    }

    private fun submit() {
        val mailed: PasswordResetToken = token ?: return
        val form: ResetPasswordUiState.Form = _state.value as? ResetPasswordUiState.Form ?: return
        if (form.status == ResetPasswordUiState.FormStatus.Sending) return
        _state.value = form.copy(status = ResetPasswordUiState.FormStatus.Sending)
        viewModelScope.launch {
            _state.value = when (sessions.resetPassword(mailed, form.password)) {
                PasswordResetResult.Changed -> ResetPasswordUiState.Changed
                PasswordResetResult.LinkRefused -> ResetPasswordUiState.LinkRefused
                PasswordResetResult.WeakPassword -> form.copy(status = ResetPasswordUiState.FormStatus.WeakPassword)
                PasswordResetResult.Unreachable -> form.copy(status = ResetPasswordUiState.FormStatus.Unexpected)
            }
        }
    }
}

private fun openingStateOf(token: PasswordResetToken?): ResetPasswordUiState =
    if (token == null) {
        ResetPasswordUiState.LinkRefused
    } else {
        ResetPasswordUiState.Form(password = "", status = ResetPasswordUiState.FormStatus.Idle)
    }
