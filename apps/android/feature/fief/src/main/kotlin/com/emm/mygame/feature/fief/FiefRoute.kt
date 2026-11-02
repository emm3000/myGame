package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.FiefRepository
import kotlin.time.Clock

@Composable
fun FiefRoute(
    fiefs: FiefRepository,
    clock: Clock,
    modifier: Modifier = Modifier,
    viewModel: FiefViewModel = viewModel { FiefViewModel(fiefs, clock) },
) {
    val state: FiefUiState by viewModel.state.collectAsStateWithLifecycle()
    FiefScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
