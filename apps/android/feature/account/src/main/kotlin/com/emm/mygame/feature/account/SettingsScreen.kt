package com.emm.mygame.feature.account

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.ui.joinsFrameTraversal
import com.emm.mygame.core.ui.rememberRevealOnce
import java.time.LocalTime

@Composable
fun SettingsScreen(
    state: SettingsUiState,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
    foldedDock: @Composable () -> Unit = {},
    themeChoice: @Composable () -> Unit = {},
) {
    val title: String = stringResource(R.string.settings_title)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .joinsFrameTraversal()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        foldedDock()
        MyGameText(
            text = title,
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        themeChoice()
        MyGameSkeleton(
            isLoading = state == SettingsUiState.Loading,
            loadingLabel = title,
            blocks = settingsBlocks,
        ) {
            SettingsState(state = state, onIntent = onIntent, onNotificationSettingsOpen = onNotificationSettingsOpen)
        }
    }
}

@Composable
private fun SettingsState(
    state: SettingsUiState,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
) {
    when (state) {
        SettingsUiState.Loading -> Unit
        SettingsUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.settings_failed),
            actionLabel = stringResource(R.string.settings_retry),
            onAction = { onIntent(SettingsIntent.RetryTapped) },
        )
        is SettingsUiState.Loaded -> ScaffoldSetting(
            loaded = state,
            onIntent = onIntent,
            onNotificationSettingsOpen = onNotificationSettingsOpen,
        )
    }
}

@Composable
private fun ScaffoldSetting(
    loaded: SettingsUiState.Loaded,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ScaffoldChoice(
            picked = loaded.shown,
            isEnabled = !loaded.isSaving,
            onPick = { scaffold: PlayerScaffold -> onIntent(SettingsIntent.ScaffoldPicked(scaffold)) },
        )
        MyGameText(
            text = stringResource(R.string.settings_cards_kept),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        ChangeLine(change = loaded.change)
        ReminderSetting(
            reminder = loaded.reminder,
            onIntent = onIntent,
            onNotificationSettingsOpen = onNotificationSettingsOpen,
        )
    }
}

@Composable
private fun ChangeLine(change: SettingsUiState.Change, modifier: Modifier = Modifier) {
    val revealed: Modifier = modifier.then(rememberRevealOnce(change))
    when (change) {
        SettingsUiState.Change.Untouched -> Unit
        is SettingsUiState.Change.Saving -> ChangeNote(text = stringResource(R.string.settings_saving), revealed)
        SettingsUiState.Change.Saved -> ChangeNote(text = stringResource(R.string.settings_saved), revealed)
        SettingsUiState.Change.Refused, SettingsUiState.Change.Unreachable ->
            MyGameInlineAlert(message = stringResource(R.string.settings_unreachable), modifier = revealed)
    }
}

@Composable
private fun ChangeNote(text: String, modifier: Modifier = Modifier) {
    MyGameText(
        text = text,
        style = MyGameTypography.body,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
    )
}

private val settingsBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.secondary, MyGameSizes.control, MyGameSizes.control),
)

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
