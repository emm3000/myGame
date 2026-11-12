package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.PlacementRepository

@Composable
fun PlacementRoute(
    placements: PlacementRepository,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PlacementViewModel = viewModel { PlacementViewModel(placements) },
) {
    val state: PlacementUiState by viewModel.state.collectAsStateWithLifecycle()
    PlacementScreen(state = state, onIntent = viewModel::onIntent, onTownOpen = onTownOpen, modifier = modifier)
}
