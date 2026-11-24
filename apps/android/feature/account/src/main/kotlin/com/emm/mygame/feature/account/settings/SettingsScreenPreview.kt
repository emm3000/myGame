package com.emm.mygame.feature.account.settings

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.account.PlayerScaffold
import java.time.LocalTime

private val previewReminder: SettingsUiState.Reminder = SettingsUiState.Reminder(
    isOn = true,
    time = LocalTime.of(19, 0),
    ask = SettingsUiState.NotificationAsk.Untouched,
)

private val previewReminderOff: SettingsUiState.Reminder = previewReminder.copy(isOn = false)

private class SettingsUiStates : PreviewParameterProvider<SettingsUiState> {

    override val values: Sequence<SettingsUiState> = sequenceOf(
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, previewReminder),
        SettingsUiState.Loaded(
            PlayerScaffold.Spanish,
            SettingsUiState.Change.Saving(PlayerScaffold.None),
            previewReminder,
        ),
        SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved, previewReminder),
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Refused, previewReminder),
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable, previewReminder),
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, previewReminderOff),
        SettingsUiState.Loaded(
            PlayerScaffold.Spanish,
            SettingsUiState.Change.Untouched,
            previewReminderOff.copy(ask = SettingsUiState.NotificationAsk.Asking),
        ),
        SettingsUiState.Loaded(
            PlayerScaffold.Spanish,
            SettingsUiState.Change.Untouched,
            previewReminderOff.copy(ask = SettingsUiState.NotificationAsk.Denied),
        ),
        SettingsUiState.Failed,
        SettingsUiState.Loading,
    )
}

@PreviewMyGame
@Composable
private fun SettingsScreenPreview(@PreviewParameter(SettingsUiStates::class) state: SettingsUiState) {
    MyGamePreviewSurface {
        SettingsScreen(state = state, onIntent = {}, onNotificationSettingsOpen = {})
    }
}
