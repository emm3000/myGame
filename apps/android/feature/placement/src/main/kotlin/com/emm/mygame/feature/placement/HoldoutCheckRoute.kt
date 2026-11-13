package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand

@Composable
fun HoldoutCheckRoute(
    holdoutChecks: HoldoutCheckRepository,
    band: PlacementBand,
    week: HoldoutCheckWeek,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HoldoutCheckViewModel = viewModel { HoldoutCheckViewModel(holdoutChecks, band, week) },
) {
    val state: HoldoutCheckUiState by viewModel.state.collectAsStateWithLifecycle()
    HoldoutCheckScreen(state = state, onIntent = viewModel::onIntent, onTownOpen = onTownOpen, modifier = modifier)
}
