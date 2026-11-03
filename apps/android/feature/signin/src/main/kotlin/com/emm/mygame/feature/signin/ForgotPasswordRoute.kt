package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.SessionRepository

@Composable
fun ForgotPasswordRoute(
    sessions: SessionRepository,
    onSignInOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ForgotPasswordViewModel = viewModel { ForgotPasswordViewModel(sessions) },
) {
    val state: ForgotPasswordUiState by viewModel.state.collectAsStateWithLifecycle()
    ForgotPasswordScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onSignInOpen = onSignInOpen,
        modifier = modifier,
    )
}
