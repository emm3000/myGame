package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.lifecycle.createSavedStateHandle
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SignUpRoute(
    sessions: SessionRepository,
    onSignedIn: () -> Unit,
    onSignInOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SignUpViewModel = signUpViewModel(sessions),
) {
    val state: SignUpUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSignedIn: () -> Unit by rememberUpdatedState(onSignedIn)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SignUpEffect ->
                when (effect) {
                    SignUpEffect.SignedIn -> currentOnSignedIn()
                }
            }
        }
    }
    SignUpScreen(state = state, onIntent = viewModel::onIntent, onSignInOpen = onSignInOpen, modifier = modifier)
}

@Composable
private fun signUpViewModel(sessions: SessionRepository): SignUpViewModel {
    val phoneScaffold: PlayerScaffold = phoneScaffoldOf(LocalConfiguration.current.locales[0])
    return viewModel {
        SignUpViewModel(sessions = sessions, savedState = createSavedStateHandle(), phoneScaffold = phoneScaffold)
    }
}
