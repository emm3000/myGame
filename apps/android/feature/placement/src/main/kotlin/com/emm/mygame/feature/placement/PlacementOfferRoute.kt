package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun PlacementOfferRoute(
    onPlacementOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PlacementOfferViewModel = koinViewModel(),
) {
    val state: PlacementOfferUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(PlacementOfferIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(PlacementOfferIntent.ScreenHidden) }
    }
    PlacementOfferRow(state = state, onPlacementOpen = onPlacementOpen, modifier = modifier)
}
