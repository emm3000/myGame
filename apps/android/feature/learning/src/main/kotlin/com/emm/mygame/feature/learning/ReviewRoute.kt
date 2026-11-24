package com.emm.mygame.feature.learning

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.ui.TaskDockHook
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun ReviewRoute(
    learning: LearningRepository,
    towns: TownRepository,
    clock: Clock,
    task: TaskDockHook,
    foldedDock: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ReviewViewModel = viewModel { ReviewViewModel(learning, towns, clock) },
) {
    val state: ReviewUiState by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(viewModel, task) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: ReviewEffect ->
                when (effect) {
                    ReviewEffect.Answered -> task.onAnswered()
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
        task = task,
        foldedDock = foldedDock,
        modifier = modifier,
    )
}
