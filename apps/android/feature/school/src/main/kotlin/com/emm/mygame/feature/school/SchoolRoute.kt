package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.TownRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SchoolRoute(
    towns: TownRepository,
    clock: Clock,
    onNoTown: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onLessonStart: () -> Unit,
    onTextOpen: (TextId) -> Unit,
    modifier: Modifier = Modifier,
    holdoutChecks: @Composable () -> Unit = {},
    foldedDock: @Composable () -> Unit = {},
    viewModel: SchoolViewModel = viewModel { SchoolViewModel(towns, clock) },
) {
    val state: SchoolUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnNoTown: () -> Unit by rememberUpdatedState(onNoTown)
    val currentOnLessonStart: () -> Unit by rememberUpdatedState(onLessonStart)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SchoolEffect ->
                when (effect) {
                    SchoolEffect.NoTown -> currentOnNoTown()
                    SchoolEffect.LessonStarted -> currentOnLessonStart()
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
        onLessonOpen = onLessonOpen,
        modifier = modifier,
        onTextOpen = onTextOpen,
        holdoutChecks = holdoutChecks,
        foldedDock = foldedDock,
    )
}
