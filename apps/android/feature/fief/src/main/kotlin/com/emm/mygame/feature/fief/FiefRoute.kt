package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.SessionRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun FiefRoute(
    fief: FiefId,
    fiefs: FiefRepository,
    sessions: SessionRepository,
    clock: Clock,
    navigation: FiefNavigation,
    modifier: Modifier = Modifier,
    viewModel: FiefViewModel = viewModel { FiefViewModel(fief, fiefs, sessions, clock) },
) {
    val state: FiefUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentNavigation: FiefNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: FiefEffect ->
                when (effect) {
                    FiefEffect.SignedOut -> currentNavigation.onSignedOut()
                    FiefEffect.FoundingApplied -> currentNavigation.onNewFief()
                }
            }
        }
    }
    DisposableEffect(viewModel) {
        viewModel.onIntent(FiefIntent.ScreenShown)
        onDispose { viewModel.onIntent(FiefIntent.ScreenHidden) }
    }
    val isSigningOut: Boolean = state == FiefUiState.SigningOut
    LaunchedEffect(isSigningOut) {
        if (isSigningOut) currentNavigation.onSigningOut()
    }
    FiefScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onReviewOpen = { currentNavigation.onReviewOpen() },
        modifier = modifier,
    )
}
