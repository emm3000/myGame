package com.emm.mygame.feature.account.settings

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
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.ui.rememberRevealOnce
import com.emm.mygame.feature.account.R
import com.emm.mygame.feature.account.scaffold.ScaffoldChoice

@Composable
internal fun SettingsScreen(
    state: SettingsUiState,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
    themeChoice: @Composable () -> Unit = {},
) {
    val title: String = stringResource(R.string.settings_title)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step5,
                end = MyGameSpacing.step5,
                top = MyGameSpacing.step4,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        MyGameHeader {
            MyGameText(
                text = title,
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
        }
        if ((state as? SettingsUiState.Loaded)?.reminder?.isOffered == true) ReminderOffer(onIntent = onIntent)
        themeChoice()
        MyGameSkeleton(
            isLoading = state == SettingsUiState.Loading,
            loadingLabel = title,
            blocks = settingsBlocks,
        ) {
            SettingsState(state = state, onIntent = onIntent, onNotificationSettingsOpen = onNotificationSettingsOpen)
        }
        SignOut(isBusy = state == SettingsUiState.SigningOut, onIntent = onIntent)
    }
}

@Composable
private fun SignOut(isBusy: Boolean, onIntent: (SettingsIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(
        label = stringResource(R.string.settings_sign_out),
        isBusy = isBusy,
        busyDescription = stringResource(R.string.settings_waiting),
        onClick = { onIntent(SettingsIntent.SignOutTapped) },
        modifier = modifier,
    )
}

@Composable
private fun ReminderOffer(onIntent: (SettingsIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(
        label = stringResource(R.string.settings_reminder_offer),
        onClick = { onIntent(SettingsIntent.ReminderSwitched(isOn = true)) },
        modifier = modifier,
    )
}

@Composable
private fun SettingsState(
    state: SettingsUiState,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
) {
    when (state) {
        SettingsUiState.Loading, SettingsUiState.SigningOut -> Unit
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
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5), modifier = modifier) {
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
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
        }
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
