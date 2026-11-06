package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock

@Composable
fun TownRoute(
    towns: TownRepository,
    clock: Clock,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TownViewModel = viewModel { TownViewModel(towns, clock) },
) {
    val state: TownUiState by viewModel.state.collectAsStateWithLifecycle()
    DisposableEffect(viewModel) {
        viewModel.onIntent(TownIntent.ScreenShown)
        onDispose { viewModel.onIntent(TownIntent.ScreenHidden) }
    }
    TownScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onSchoolOpen = onSchoolOpen,
        onReportOpen = onReportOpen,
        modifier = modifier,
    )
}
