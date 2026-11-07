package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SchoolRoute(
    towns: TownRepository,
    clock: Clock,
    onNoTown: () -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SchoolViewModel = viewModel { SchoolViewModel(towns, clock) },
) {
    val state: SchoolUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnNoTown: () -> Unit by rememberUpdatedState(onNoTown)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SchoolEffect ->
                when (effect) {
                    SchoolEffect.NoTown -> currentOnNoTown()
                }
            }
        }
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(SchoolIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(SchoolIntent.ScreenHidden) }
    }
    SchoolScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onReviewsOpen = onReviewsOpen,
        onLessonOpen = onLessonOpen,
        onReportOpen = onReportOpen,
        modifier = modifier,
    )
}
