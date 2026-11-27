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
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.control.MyGameErrorBanner
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.control.MyGameTextLink
import com.emm.mygame.core.designsystem.frame.MyGameSkeleton
import com.emm.mygame.core.designsystem.frame.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.navigation.MyGameTabHeader
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
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
    ring: @Composable () -> Unit = {},
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
        MyGameTabHeader(title = title, ring = ring)
        if (state.shownSettings()?.reminder?.isOffered == true) {
            ReminderOffer(isEnabled = state is SettingsUiState.Loaded, onIntent = onIntent)
        }
        themeChoice()
        MyGameSkeleton(
            isLoading = state == SettingsUiState.Loading,
            loadingLabel = title,
            blocks = settingsBlocks,
        ) {
            SettingsState(state = state, onIntent = onIntent, onNotificationSettingsOpen = onNotificationSettingsOpen)
        }
        SignOut(isBusy = state is SettingsUiState.SigningOut, onIntent = onIntent)
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
private fun ReminderOffer(isEnabled: Boolean, onIntent: (SettingsIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(
        label = stringResource(R.string.settings_reminder_offer),
        onClick = { onIntent(SettingsIntent.ReminderSwitched(isOn = true)) },
        modifier = modifier,
        isEnabled = isEnabled,
    )
}

@Composable
private fun SettingsState(
    state: SettingsUiState,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
) {
    when (state) {
        SettingsUiState.Loading -> Unit
        is SettingsUiState.SigningOut -> if (state.kept != null) {
            ScaffoldSetting(
                loaded = state.kept,
                isEnabled = false,
                onIntent = onIntent,
                onNotificationSettingsOpen = onNotificationSettingsOpen,
            )
        }
        SettingsUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.settings_failed),
            actionLabel = stringResource(R.string.settings_retry),
            onAction = { onIntent(SettingsIntent.RetryTapped) },
        )
        is SettingsUiState.Loaded -> ScaffoldSetting(
            loaded = state,
            isEnabled = true,
            onIntent = onIntent,
            onNotificationSettingsOpen = onNotificationSettingsOpen,
        )
    }
}

@Composable
private fun ScaffoldSetting(
    loaded: SettingsUiState.Loaded,
    isEnabled: Boolean,
    onIntent: (SettingsIntent) -> Unit,
    onNotificationSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step5), modifier = modifier) {
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            ScaffoldChoice(
                picked = loaded.shown,
                isEnabled = isEnabled && !loaded.isSaving,
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
            isEnabled = isEnabled,
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

private fun SettingsUiState.shownSettings(): SettingsUiState.Loaded? = when (this) {
    is SettingsUiState.Loaded -> this
    is SettingsUiState.SigningOut -> kept
    SettingsUiState.Loading, SettingsUiState.Failed -> null
}

private val settingsBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.secondary, MyGameSizes.control, MyGameSizes.control),
)
