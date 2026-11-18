package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.TaskDockHook
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun HoldoutCheckRoute(
    holdoutChecks: HoldoutCheckRepository,
    band: PlacementBand,
    week: HoldoutCheckWeek,
    hook: TaskDockHook,
    modifier: Modifier = Modifier,
    viewModel: HoldoutCheckViewModel = viewModel { HoldoutCheckViewModel(holdoutChecks, band, week) },
) {
    val state: HoldoutCheckUiState by viewModel.state.collectAsStateWithLifecycle()
    val onEnded: () -> Unit by rememberUpdatedState(hook.onAnswered)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: HoldoutCheckEffect ->
                when (effect) {
                    HoldoutCheckEffect.Ended -> onEnded()
                }
            }
        }
    }
    HoldoutCheckScreen(state = state, onIntent = viewModel::onIntent, hook = hook, modifier = modifier)
}
