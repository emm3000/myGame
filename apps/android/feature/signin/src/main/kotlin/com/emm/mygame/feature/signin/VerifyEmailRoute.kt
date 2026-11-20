package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.createSavedStateHandle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.network.SessionRepository

@Composable
fun VerifyEmailRoute(
    sessions: SessionRepository,
    token: EmailVerificationToken?,
    onTownOpen: () -> Unit,
    onSignInOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: VerifyEmailViewModel = viewModel {
        VerifyEmailViewModel(sessions = sessions, savedState = createSavedStateHandle(), token = token)
    },
) {
    val state: VerifyEmailUiState by viewModel.state.collectAsStateWithLifecycle()
    VerifyEmailScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onTownOpen = onTownOpen,
        onSignInOpen = onSignInOpen,
        modifier = modifier,
    )
}
