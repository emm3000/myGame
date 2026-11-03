package com.emm.mygame.feature.map

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.MapRepository

@Composable
fun MapRoute(
    maps: MapRepository,
    fiefs: FiefRepository,
    modifier: Modifier = Modifier,
    viewModel: MapViewModel = viewModel { MapViewModel(maps, fiefs) },
) {
    val state: MapUiState by viewModel.state.collectAsStateWithLifecycle()
    MapScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
