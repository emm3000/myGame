package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.SessionRepository
import kotlin.time.Clock

@Composable
fun FiefRoute(
    fiefs: FiefRepository,
    sessions: SessionRepository,
    clock: Clock,
    onSignedOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: FiefViewModel = viewModel { FiefViewModel(fiefs, sessions, clock) },
) {
    val state: FiefUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSignedOut: () -> Unit by rememberUpdatedState(onSignedOut)
    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect: FiefEffect ->
            when (effect) {
                FiefEffect.SignedOut -> currentOnSignedOut()
            }
        }
    }
    FiefScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
