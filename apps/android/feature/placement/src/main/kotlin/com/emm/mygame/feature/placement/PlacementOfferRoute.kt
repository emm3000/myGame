package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.placement.PlacementRepository

@Composable
fun PlacementOfferRoute(
    placements: PlacementRepository,
    onPlacementOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PlacementOfferViewModel = viewModel { PlacementOfferViewModel(placements) },
) {
    val state: PlacementOfferUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(PlacementOfferIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(PlacementOfferIntent.ScreenHidden) }
    }
    PlacementOfferRow(state = state, onPlacementOpen = onPlacementOpen, modifier = modifier)
}
