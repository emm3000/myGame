package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SignInRoute(
    sessions: SessionRepository,
    isSessionEnded: Boolean,
    onSignedIn: () -> Unit,
    onSignUpOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SignInViewModel = viewModel { SignInViewModel(sessions, isSessionEnded) },
) {
    val state: SignInUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSignedIn: () -> Unit by rememberUpdatedState(onSignedIn)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SignInEffect ->
                when (effect) {
                    SignInEffect.SignedIn -> currentOnSignedIn()
                }
            }
        }
    }
    SignInScreen(state = state, onIntent = viewModel::onIntent, onSignUpOpen = onSignUpOpen, modifier = modifier)
}
