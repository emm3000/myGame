package com.emm.mygame.feature.report

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionRepository
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun ReportRoute(
    reports: ReportRepository,
    sessions: SessionRepository,
    clock: Clock,
    navigation: ReportNavigation,
    modifier: Modifier = Modifier,
    viewModel: ReportViewModel = viewModel { ReportViewModel(reports, sessions, clock) },
) {
    val state: ReportUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentNavigation: ReportNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: ReportEffect ->
                when (effect) {
                    ReportEffect.SignedOut -> currentNavigation.onSignedOut()
                }
            }
        }
    }
    val isSigningOut: Boolean = state == ReportUiState.SigningOut
    LaunchedEffect(isSigningOut) {
        if (isSigningOut) currentNavigation.onSigningOut()
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(ReportIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(ReportIntent.ScreenHidden) }
    }
    ReportScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onReviewsOpen = navigation.onReviewsOpen,
        onLessonOpen = navigation.onLessonOpen,
        onNewsOpen = navigation.onNewsOpen,
        modifier = modifier,
    )
}
