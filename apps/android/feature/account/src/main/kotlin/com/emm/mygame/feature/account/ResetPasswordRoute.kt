package com.emm.mygame.feature.account

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.account.PasswordResetToken
import com.emm.mygame.core.model.account.SessionRepository

@Composable
fun ResetPasswordRoute(
    sessions: SessionRepository,
    token: PasswordResetToken?,
    onSignInOpen: () -> Unit,
    onForgotPasswordOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ResetPasswordViewModel = viewModel { ResetPasswordViewModel(sessions, token) },
) {
    val state: ResetPasswordUiState by viewModel.state.collectAsStateWithLifecycle()
    ResetPasswordScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onSignInOpen = onSignInOpen,
        onForgotPasswordOpen = onForgotPasswordOpen,
        modifier = modifier,
    )
}
