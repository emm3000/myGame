package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.SessionRepository
import kotlinx.coroutines.flow.StateFlow

@Composable
fun SettingsRoute(
    sessions: SessionRepository,
    playerLanguage: StateFlow<PlayerLanguage?>,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SettingsViewModel = viewModel { SettingsViewModel(sessions, playerLanguage) },
) {
    val state: SettingsUiState by viewModel.state.collectAsStateWithLifecycle()
    SettingsScreen(state = state, onIntent = viewModel::onIntent, onTownOpen = onTownOpen, modifier = modifier)
}
