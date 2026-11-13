package com.emm.mygame.feature.signin

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
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.PlayerScaffold

@Composable
fun SettingsScreen(
    state: SettingsUiState,
    onIntent: (SettingsIntent) -> Unit,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val title: String = stringResource(R.string.settings_title)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        MyGameText(
            text = title,
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == SettingsUiState.Loading,
            loadingLabel = title,
            blocks = settingsBlocks,
        ) {
            SettingsState(state = state, onIntent = onIntent)
        }
        MyGameTextLink(label = stringResource(R.string.settings_back), onClick = onTownOpen)
    }
}

@Composable
private fun SettingsState(state: SettingsUiState, onIntent: (SettingsIntent) -> Unit) {
    when (state) {
        SettingsUiState.Loading -> Unit
        SettingsUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.settings_failed),
            actionLabel = stringResource(R.string.settings_retry),
            onAction = { onIntent(SettingsIntent.RetryTapped) },
        )
        is SettingsUiState.Loaded -> ScaffoldSetting(loaded = state, onIntent = onIntent)
    }
}

@Composable
private fun ScaffoldSetting(
    loaded: SettingsUiState.Loaded,
    onIntent: (SettingsIntent) -> Unit,
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
    }
}

@Composable
private fun ChangeLine(change: SettingsUiState.Change, modifier: Modifier = Modifier) {
    when (change) {
        SettingsUiState.Change.Untouched -> Unit
        is SettingsUiState.Change.Saving -> ChangeNote(text = stringResource(R.string.settings_saving), modifier)
        SettingsUiState.Change.Saved -> ChangeNote(text = stringResource(R.string.settings_saved), modifier)
        SettingsUiState.Change.Refused, SettingsUiState.Change.Unreachable ->
            MyGameInlineAlert(message = stringResource(R.string.settings_unreachable), modifier = modifier)
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

private class SettingsUiStates : PreviewParameterProvider<SettingsUiState> {

    override val values: Sequence<SettingsUiState> = sequenceOf(
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched),
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Saving(PlayerScaffold.None)),
        SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved),
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Refused),
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable),
        SettingsUiState.Failed,
        SettingsUiState.Loading,
    )
}

@PreviewMyGame
@Composable
private fun SettingsScreenPreview(@PreviewParameter(SettingsUiStates::class) state: SettingsUiState) {
    MyGamePreviewSurface {
        SettingsScreen(state = state, onIntent = {}, onTownOpen = {})
    }
}
