package com.emm.mygame.feature.holdout

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository

@Composable
fun HoldoutCheckRowsRoute(
    holdoutChecks: HoldoutCheckRepository,
    onHoldoutCheckOpen: (HoldoutCheckRow) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HoldoutCheckRowsViewModel = viewModel { HoldoutCheckRowsViewModel(holdoutChecks) },
) {
    val state: HoldoutCheckRowsUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(HoldoutCheckRowsIntent.ScreenHidden) }
    }
    HoldoutCheckRows(state = state, onHoldoutCheckOpen = onHoldoutCheckOpen, modifier = modifier)
}
