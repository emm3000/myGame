package com.emm.mygame.feature.holdout

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun HoldoutCheckRoute(
    holdoutChecks: HoldoutCheckRepository,
    band: PlacementBand,
    week: HoldoutCheckWeek,
    onEnd: () -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HoldoutCheckViewModel = viewModel { HoldoutCheckViewModel(holdoutChecks, band, week) },
) {
    val state: HoldoutCheckUiState by viewModel.state.collectAsStateWithLifecycle()
    val onCheckEnded: () -> Unit by rememberUpdatedState(onEnd)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: HoldoutCheckEffect ->
                when (effect) {
                    HoldoutCheckEffect.Ended -> onCheckEnded()
                }
            }
        }
    }
    HoldoutCheckScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onDone = onDone,
        modifier = modifier,
    )
}
