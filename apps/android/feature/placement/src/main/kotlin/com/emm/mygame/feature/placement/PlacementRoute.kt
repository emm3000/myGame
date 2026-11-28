package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun PlacementRoute(
    onEnd: () -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PlacementViewModel = koinViewModel(),
) {
    val state: PlacementUiState by viewModel.state.collectAsStateWithLifecycle()
    val onPlacementEnded: () -> Unit by rememberUpdatedState(onEnd)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: PlacementEffect ->
                when (effect) {
                    PlacementEffect.Ended -> onPlacementEnded()
                }
            }
        }
    }
    PlacementScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onDone = onDone,
        modifier = modifier,
    )
}
