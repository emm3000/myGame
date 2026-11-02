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
fun SignInRoute(
    sessions: SessionRepository,
    onSignedIn: () -> Unit,
    onSignUpOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SignInViewModel = viewModel { SignInViewModel(sessions) },
) {
    val state: SignInUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSignedIn: () -> Unit by rememberUpdatedState(onSignedIn)
    val isSignedIn: Boolean = state is SignInUiState.SignedIn
    LaunchedEffect(isSignedIn) {
        if (isSignedIn) currentOnSignedIn()
    }
    SignInScreen(state = state, onIntent = viewModel::onIntent, onSignUpOpen = onSignUpOpen, modifier = modifier)
}
