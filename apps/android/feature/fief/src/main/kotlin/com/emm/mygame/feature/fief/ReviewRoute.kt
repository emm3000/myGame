package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.LearningRepository
import kotlin.time.Clock

@Composable
fun ReviewRoute(
    learning: LearningRepository,
    clock: Clock,
    modifier: Modifier = Modifier,
    viewModel: ReviewViewModel = viewModel { ReviewViewModel(learning, clock) },
) {
    val state: ReviewUiState by viewModel.state.collectAsStateWithLifecycle()
    ReviewScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
