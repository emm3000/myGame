package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.SessionRepository

@Composable
fun SignUpRoute(
    sessions: SessionRepository,
    onSignedIn: () -> Unit,
    onSignInOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SignUpViewModel = viewModel { SignUpViewModel(sessions) },
) {
    val state: SignUpUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSignedIn: () -> Unit by rememberUpdatedState(onSignedIn)
    val isSignedIn: Boolean = state is SignUpUiState.SignedIn
    LaunchedEffect(isSignedIn) {
        if (isSignedIn) currentOnSignedIn()
    }
    SignUpScreen(state = state, onIntent = viewModel::onIntent, onSignInOpen = onSignInOpen, modifier = modifier)
}
