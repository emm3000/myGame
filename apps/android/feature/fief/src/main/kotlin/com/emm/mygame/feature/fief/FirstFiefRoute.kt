package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun FirstFiefRoute(
    listings: FiefListRepository,
    sessions: SessionRepository,
    onOpen: (FiefId) -> Unit,
    onSignedOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: FirstFiefViewModel = viewModel { FirstFiefViewModel(listings, sessions) },
) {
    val state: FirstFiefUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnOpen: (FiefId) -> Unit by rememberUpdatedState(onOpen)
    val currentOnSignedOut: () -> Unit by rememberUpdatedState(onSignedOut)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: FirstFiefEffect ->
                when (effect) {
                    is FirstFiefEffect.Opened -> currentOnOpen(effect.fief)
                    FirstFiefEffect.SignedOut -> currentOnSignedOut()
                }
            }
        }
    }
    FirstFiefScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
