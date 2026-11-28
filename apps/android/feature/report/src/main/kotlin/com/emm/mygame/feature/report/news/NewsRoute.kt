package com.emm.mygame.feature.report.news

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun NewsRoute(modifier: Modifier = Modifier, viewModel: NewsViewModel = koinViewModel()) {
    val state: NewsUiState by viewModel.state.collectAsStateWithLifecycle()
    NewsScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
