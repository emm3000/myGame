package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignInResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SignInViewModel(private val sessions: SessionRepository) : ViewModel() {

    private val _state: MutableStateFlow<SignInUiState> = MutableStateFlow(SignInUiState.CheckingSession)

    val state: StateFlow<SignInUiState> = _state.asStateFlow()

    init {
        checkSession()
    }

    fun onIntent(intent: SignInIntent) {
        when (intent) {
            is SignInIntent.EmailChanged -> updateForm { copy(email = intent.email) }
            is SignInIntent.PasswordChanged -> updateForm { copy(password = intent.password) }
            SignInIntent.SubmitTapped -> submit()
            SignInIntent.RetryTapped -> retry()
        }
    }

    private fun checkSession() {
        _state.value = SignInUiState.CheckingSession
        viewModelScope.launch {
            _state.value = when (val restored: RestoreResult = sessions.restore()) {
                is RestoreResult.SignedIn -> SignInUiState.SignedIn(email = restored.player.email)
                RestoreResult.SignedOut -> blankForm(SignInUiState.FormStatus.Idle)
                RestoreResult.Unreachable ->
                    blankForm(SignInUiState.FormStatus.Unreachable(SignInUiState.Attempt.SessionCheck))
            }
        }
    }

    private fun submit() {
        val form: SignInUiState.Form = _state.value as? SignInUiState.Form ?: return
        if (form.status == SignInUiState.FormStatus.Submitting) return
        _state.value = form.copy(status = SignInUiState.FormStatus.Submitting)
        viewModelScope.launch {
            val answer: SignInResult = sessions.signIn(email = form.email, password = form.password)
            _state.value = when (answer) {
                is SignInResult.SignedIn -> SignInUiState.SignedIn(email = answer.player.email)
                is SignInResult.Refused -> form.copy(status = SignInUiState.FormStatus.Refused(answer.kind))
                SignInResult.Unreachable ->
                    form.copy(status = SignInUiState.FormStatus.Unreachable(SignInUiState.Attempt.SignIn))
            }
        }
    }

    private fun retry() {
        val form: SignInUiState.Form = _state.value as? SignInUiState.Form ?: return
        val status: SignInUiState.FormStatus.Unreachable =
            form.status as? SignInUiState.FormStatus.Unreachable ?: return
        when (status.failedAttempt) {
            SignInUiState.Attempt.SessionCheck -> checkSession()
            SignInUiState.Attempt.SignIn -> submit()
        }
    }

    private fun updateForm(edit: SignInUiState.Form.() -> SignInUiState.Form) {
        _state.update { current ->
            if (current is SignInUiState.Form && current.status != SignInUiState.FormStatus.Submitting) {
                current.edit()
            } else {
                current
            }
        }
    }

    private fun blankForm(status: SignInUiState.FormStatus): SignInUiState.Form =
        SignInUiState.Form(email = "", password = "", status = status)
}
