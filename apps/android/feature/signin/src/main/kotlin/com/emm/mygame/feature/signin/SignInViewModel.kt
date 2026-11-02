package com.emm.mygame.feature.signin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.SignInResult
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SignInViewModel(private val sessions: SessionRepository) : ViewModel() {

    private val _state: MutableStateFlow<SignInUiState> = MutableStateFlow(SignInUiState.CheckingSession)

    val state: StateFlow<SignInUiState> = _state.asStateFlow()

    private val _effects: Channel<SignInEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<SignInEffect> = _effects.receiveAsFlow()

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
            when (sessions.restore()) {
                is RestoreResult.SignedIn -> _effects.send(SignInEffect.SignedIn)
                RestoreResult.SignedOut -> _state.value = blankForm()
                RestoreResult.Unreachable -> showUnreachable(blankForm(), SignInUiState.Attempt.SessionCheck)
            }
        }
    }

    private fun submit() {
        val form: SignInUiState.Form = _state.value as? SignInUiState.Form ?: return
        if (form.status == SignInUiState.FormStatus.Submitting) return
        _state.value = form.copy(status = SignInUiState.FormStatus.Submitting)
        viewModelScope.launch {
            val answer: SignInResult = sessions.signIn(email = form.email, password = form.password)
            when (answer) {
                is SignInResult.SignedIn -> _effects.send(SignInEffect.SignedIn)
                is SignInResult.Refused ->
                    _state.value = form.copy(status = SignInUiState.FormStatus.Refused(answer.kind))
                SignInResult.Unreachable -> showUnreachable(form, SignInUiState.Attempt.SignIn)
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

    private fun showUnreachable(form: SignInUiState.Form, failedAttempt: SignInUiState.Attempt) {
        _state.value = form.copy(status = SignInUiState.FormStatus.Unreachable(failedAttempt))
    }

    private fun blankForm(): SignInUiState.Form =
        SignInUiState.Form(email = "", password = "", status = SignInUiState.FormStatus.Idle)
}
