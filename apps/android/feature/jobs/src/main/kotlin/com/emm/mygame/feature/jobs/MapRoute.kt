package com.emm.mygame.feature.jobs

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun MapRoute(
    onNoTown: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MapViewModel = koinViewModel(),
) {
    val state: MapUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnNoTown: () -> Unit by rememberUpdatedState(onNoTown)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: MapEffect ->
                when (effect) {
                    MapEffect.NoTown -> currentOnNoTown()
                }
            }
        }
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(MapIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(MapIntent.ScreenHidden) }
    }
    MapScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
