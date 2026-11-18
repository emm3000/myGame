package com.emm.mygame

import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusUiState

internal class SignedInChrome(
    val dependencies: AppDependencies,
    val navigator: Navigator,
    val status: State<TownStatusUiState>,
    val onStatusIntent: (TownStatusIntent) -> Unit,
    val banner: @Composable () -> Unit,
)
