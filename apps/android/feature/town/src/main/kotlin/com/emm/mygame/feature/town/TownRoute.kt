package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.town.TownRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.time.Clock

@Composable
fun TownRoute(
    towns: TownRepository,
    sessions: SessionRepository,
    clock: Clock,
    navigation: TownNavigation,
    modifier: Modifier = Modifier,
    viewModel: TownViewModel = viewModel { TownViewModel(towns, sessions, clock) },
    ring: @Composable () -> Unit = {},
    placement: @Composable () -> Unit = {},
) {
    val state: TownUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentNavigation: TownNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: TownEffect ->
                when (effect) {
                    TownEffect.SigningOut -> currentNavigation.onSigningOut()
                    TownEffect.SignedOut -> currentNavigation.onSignedOut()
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
        onIntent = viewModel::onIntent,
        onSchoolOpen = navigation.onSchoolOpen,
        onMapOpen = navigation.onMapOpen,
        onTextOpen = navigation.onTextOpen,
        modifier = modifier,
        ring = ring,
        placement = placement,
    )
}
