package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignUpResult
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SignUpViewModel(private val sessions: SessionRepository) : ViewModel() {

    private val _state: MutableStateFlow<SignUpUiState> = MutableStateFlow(
        SignUpUiState.Form(email = "", password = "", fiefName = "", status = SignUpUiState.FormStatus.Idle),
    )

    val state: StateFlow<SignUpUiState> = _state.asStateFlow()

    private val _effects: Channel<SignUpEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<SignUpEffect> = _effects.receiveAsFlow()

    fun onIntent(intent: SignUpIntent) {
        when (intent) {
            is SignUpIntent.EmailChanged -> updateForm { copy(email = intent.email) }
            is SignUpIntent.PasswordChanged -> updateForm { copy(password = intent.password) }
            is SignUpIntent.FiefNameChanged -> updateForm { copy(fiefName = intent.fiefName) }
            SignUpIntent.SubmitTapped -> submit()
            SignUpIntent.RetryTapped -> retry()
        }
    }

    private fun submit() {
        val form: SignUpUiState.Form = _state.value as? SignUpUiState.Form ?: return
        if (form.status == SignUpUiState.FormStatus.Submitting) return
        _state.value = form.copy(status = SignUpUiState.FormStatus.Submitting)
        viewModelScope.launch {
            val answer: SignUpResult =
                sessions.signUp(email = form.email, password = form.password, fiefName = form.fiefName)
            when (answer) {
                is SignUpResult.SignedIn -> _effects.send(SignUpEffect.SignedIn)
                is SignUpResult.Refused ->
                    _state.value = form.copy(status = SignUpUiState.FormStatus.Refused(answer.refusal))
                SignUpResult.Unreachable -> _state.value = form.copy(status = SignUpUiState.FormStatus.Unreachable)
            }
        }
    }

    private fun retry() {
        val form: SignUpUiState.Form = _state.value as? SignUpUiState.Form ?: return
        if (form.status == SignUpUiState.FormStatus.Unreachable) submit()
    }

    private fun updateForm(edit: SignUpUiState.Form.() -> SignUpUiState.Form) {
        _state.update { current ->
            if (current is SignUpUiState.Form && current.status != SignUpUiState.FormStatus.Submitting) {
                current.edit()
            } else {
                current
            }
        }
    }
}
