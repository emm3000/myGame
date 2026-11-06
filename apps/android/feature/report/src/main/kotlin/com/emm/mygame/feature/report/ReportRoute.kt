package com.emm.mygame.feature.report

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.ReportRepository
import kotlin.time.Clock

@Composable
fun ReportRoute(
    reports: ReportRepository,
    clock: Clock,
    onReviewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ReportViewModel = viewModel { ReportViewModel(reports, clock) },
) {
    val state: ReportUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(ReportIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(ReportIntent.ScreenHidden) }
    }
    ReportScreen(state = state, onIntent = viewModel::onIntent, onReviewsOpen = onReviewsOpen, modifier = modifier)
}
