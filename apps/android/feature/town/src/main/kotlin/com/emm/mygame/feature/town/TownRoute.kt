package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.building.TownBuildingKind
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.time.Clock

@Composable
fun TownRoute(
    towns: TownRepository,
    clock: Clock,
    navigation: TownNavigation,
    place: TownBuildingKind?,
    modifier: Modifier = Modifier,
    viewModel: TownViewModel = viewModel { TownViewModel(towns, clock) },
    ring: @Composable () -> Unit = {},
) {
    val state: TownUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentNavigation: TownNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: TownEffect ->
                when (effect) {
                    TownEffect.Unnamed -> currentNavigation.onUnnamed()
                    TownEffect.Named -> currentNavigation.onNamed()
                }
            }
        }
    }
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(TownIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(TownIntent.ScreenHidden) }
    }
    TownScreen(
        state = state,
        place = place,
        onIntent = viewModel::onIntent,
        onPlaceOpen = navigation.onPlaceOpen,
        onNewsOpen = navigation.onNewsOpen,
        onSchoolOpen = navigation.onSchoolOpen,
        onMapOpen = navigation.onMapOpen,
        modifier = modifier,
        ring = ring,
    )
}
