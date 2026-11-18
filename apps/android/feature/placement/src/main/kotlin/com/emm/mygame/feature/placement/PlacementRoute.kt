package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.ui.TaskDockHook
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun PlacementRoute(
    placements: PlacementRepository,
    hook: TaskDockHook,
    modifier: Modifier = Modifier,
    viewModel: PlacementViewModel = viewModel { PlacementViewModel(placements) },
) {
    val state: PlacementUiState by viewModel.state.collectAsStateWithLifecycle()
    val onEnded: () -> Unit by rememberUpdatedState(hook.onAnswered)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: PlacementEffect ->
                when (effect) {
                    PlacementEffect.Ended -> onEnded()
                }
            }
        }
    }
    PlacementScreen(state = state, onIntent = viewModel::onIntent, hook = hook, modifier = modifier)
}
