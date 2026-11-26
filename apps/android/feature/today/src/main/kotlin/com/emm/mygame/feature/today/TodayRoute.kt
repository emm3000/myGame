package com.emm.mygame.feature.today

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.town.TownRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.time.Clock

@Composable
fun TodayRoute(
    towns: TownRepository,
    reports: ReportRepository,
    clock: Clock,
    navigation: TodayNavigation,
    modifier: Modifier = Modifier,
    viewModel: TodayViewModel = viewModel { TodayViewModel(towns, reports, clock) },
    ring: @Composable () -> Unit = {},
    placement: @Composable () -> Unit = {},
) {
    val state: TodayUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentNavigation: TodayNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: TodayEffect ->
                when (effect) {
                    TodayEffect.NoTown -> currentNavigation.onNoTown()
                }
            }
        }
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(TodayIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(TodayIntent.ScreenHidden) }
    }
    TodayScreen(
        state = state,
        onIntent = viewModel::onIntent,
        navigation = navigation,
        modifier = modifier,
        ring = ring,
        placement = placement,
    )
}
