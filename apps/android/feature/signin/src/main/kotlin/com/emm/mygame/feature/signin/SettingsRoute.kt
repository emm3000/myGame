package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.ThemeSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext

@Composable
fun SettingsRoute(
    sessions: SessionRepository,
    playerScaffold: StateFlow<PlayerScaffold?>,
    reminders: StudyReminderSettings,
    notifications: ReminderNotifications,
    themes: ThemeSettings,
    rememberNotificationAsk: @Composable (onAnswer: (Boolean) -> Unit) -> () -> Unit,
    navigation: SettingsNavigation,
    modifier: Modifier = Modifier,
    foldedDock: @Composable () -> Unit = {},
    viewModel: SettingsViewModel = viewModel {
        SettingsViewModel(sessions, playerScaffold, reminders, notifications, themes)
    },
) {
    val state: SettingsUiState by viewModel.state.collectAsStateWithLifecycle()
    val askNotifications: () -> Unit = rememberNotificationAsk { isGranted: Boolean ->
        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted))
    }
    val currentAsk: () -> Unit by rememberUpdatedState(askNotifications)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SettingsEffect ->
                when (effect) {
                    SettingsEffect.AskNotifications -> currentAsk()
                }
            }
        }
    }
    LifecycleResumeEffect(viewModel) {
        viewModel.onIntent(SettingsIntent.ScreenResumed)
        onPauseOrDispose {}
    }
    SettingsScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onTownOpen = navigation.onTownOpen,
        onNotificationSettingsOpen = navigation.onNotificationSettingsOpen,
        modifier = modifier,
        foldedDock = foldedDock,
    )
}
