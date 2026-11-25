package com.emm.mygame.feature.learning.reviews

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.town.TownReader
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun ReviewRoute(
    learning: LearningRepository,
    towns: TownReader,
    clock: Clock,
    onAnswer: () -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ReviewViewModel = viewModel { ReviewViewModel(learning, towns, clock) },
) {
    val state: ReviewUiState by viewModel.state.collectAsStateWithLifecycle()
    val onReviewAnswered: () -> Unit by rememberUpdatedState(onAnswer)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: ReviewEffect ->
                when (effect) {
                    ReviewEffect.Answered -> onReviewAnswered()
                }
            }
        }
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(ReviewIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(ReviewIntent.ScreenHidden) }
    }
    ReviewScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onDone = onDone,
        modifier = modifier,
    )
}
