package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun TownRoute(
    towns: TownRepository,
    sessions: SessionRepository,
    clock: Clock,
    onSchoolOpen: () -> Unit,
    onSigningOut: () -> Unit,
    onSignedOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TownViewModel = viewModel { TownViewModel(towns, sessions, clock) },
) {
    val state: TownUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSigningOut: () -> Unit by rememberUpdatedState(onSigningOut)
    val currentOnSignedOut: () -> Unit by rememberUpdatedState(onSignedOut)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: TownEffect ->
                when (effect) {
                    TownEffect.SignedOut -> currentOnSignedOut()
                }
            }
        }
    }
    DisposableEffect(viewModel) {
        viewModel.onIntent(TownIntent.ScreenShown)
        onDispose { viewModel.onIntent(TownIntent.ScreenHidden) }
    }
    val isSigningOut: Boolean = state == TownUiState.SigningOut
    LaunchedEffect(isSigningOut) {
        if (isSigningOut) currentOnSigningOut()
    }
    TownScreen(state = state, onIntent = viewModel::onIntent, onSchoolOpen = onSchoolOpen, modifier = modifier)
}
