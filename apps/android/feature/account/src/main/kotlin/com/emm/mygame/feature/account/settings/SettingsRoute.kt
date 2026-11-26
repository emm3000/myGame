package com.emm.mygame.feature.account.settings

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SettingsRoute(
    sources: SettingsSources,
    rememberNotificationAsk: @Composable (onAnswer: (Boolean) -> Unit) -> () -> Unit,
    navigation: SettingsNavigation,
    modifier: Modifier = Modifier,
    viewModel: SettingsViewModel = viewModel {
        SettingsViewModel(
            sources.sessions,
            sources.playerScaffold,
            sources.reminders,
            sources.notifications,
            sources.reports,
        )
    },
) {
    val state: SettingsUiState by viewModel.state.collectAsStateWithLifecycle()
    val askNotifications: () -> Unit = rememberNotificationAsk { isGranted: Boolean ->
        viewModel.onIntent(SettingsIntent.NotificationsAnswered(isGranted))
    }
    val currentAsk: () -> Unit by rememberUpdatedState(askNotifications)
    val currentNavigation: SettingsNavigation by rememberUpdatedState(navigation)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SettingsEffect ->
                when (effect) {
                    SettingsEffect.AskNotifications -> currentAsk()
                    SettingsEffect.SigningOut -> currentNavigation.onSigningOut()
                    SettingsEffect.SignedOut -> currentNavigation.onSignedOut()
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
        onNotificationSettingsOpen = navigation.onNotificationSettingsOpen,
        modifier = modifier,
        themeChoice = { ThemeChoiceRoute(sources.themes) },
    )
}
