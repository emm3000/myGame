package com.emm.mygame.feature.jobs

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.town.jobs.TownRegionRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun MapRoute(
    towns: TownRegionRepository,
    clock: Clock,
    onNoTown: () -> Unit,
    modifier: Modifier = Modifier,
    foldedDock: @Composable () -> Unit = {},
    viewModel: MapViewModel = viewModel { MapViewModel(towns, clock) },
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
    MapScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier, foldedDock = foldedDock)
}
