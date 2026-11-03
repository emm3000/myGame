package com.emm.mygame.feature.chronicle

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.ChronicleRepository
import com.emm.mygame.core.network.FiefId
import kotlin.time.Clock

@Composable
fun ChronicleRoute(
    fief: FiefId,
    chronicles: ChronicleRepository,
    clock: Clock,
    modifier: Modifier = Modifier,
    viewModel: ChronicleViewModel = viewModel { ChronicleViewModel(fief, chronicles, clock) },
) {
    val state: ChronicleUiState by viewModel.state.collectAsStateWithLifecycle()
    ChronicleScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
