package com.emm.mygame.feature.report

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.ReportRepository
import kotlin.time.Clock

@Composable
fun NewsRoute(
    reports: ReportRepository,
    clock: Clock,
    modifier: Modifier = Modifier,
    viewModel: NewsViewModel = viewModel { NewsViewModel(reports, clock) },
) {
    val state: NewsUiState by viewModel.state.collectAsStateWithLifecycle()
    NewsScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
