package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun LessonWordsRoute(
    walk: LessonWalk,
    towns: TownRepository,
    reports: ReportRepository,
    clock: Clock,
    navigation: LessonWordsNavigation,
    modifier: Modifier = Modifier,
    viewModel: LessonWordsViewModel = viewModel { LessonWordsViewModel(walk, towns, reports, clock) },
) {
    val state: LessonWordsUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentNavigation: LessonWordsNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: LessonWordsEffect ->
                when (effect) {
                    LessonWordsEffect.NoTown -> currentNavigation.onNoTown()
                }
            }
        }
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(LessonWordsIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(LessonWordsIntent.ScreenHidden) }
    }
    LessonWordsScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onWayOn = { wayOn: LessonWordsUiState.WayOn ->
            when (wayOn) {
                is LessonWordsUiState.WayOn.Lesson -> navigation.onLessonOpen(wayOn.lesson, walk.opened)
                LessonWordsUiState.WayOn.Reviews -> navigation.onReviewsOpen()
            }
        },
        onSchoolOpen = navigation.onSchoolOpen,
        modifier = modifier,
    )
}
