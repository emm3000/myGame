package com.emm.mygame.feature.placement

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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementChoice
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
fun HoldoutCheckScreen(
    state: HoldoutCheckUiState,
    onIntent: (HoldoutCheckIntent) -> Unit,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(start = MyGameSpacing.step4, end = MyGameSpacing.step4, top = MyGameSpacing.step8)
            .padding(bottom = MyGameSpacing.step8),
    ) {
        MyGameText(
            text = fixedCopyResource(R.string.placement_holdout_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == HoldoutCheckUiState.Loading,
            loadingLabel = fixedCopyResource(R.string.placement_holdout_loading),
            blocks = holdoutCheckBlocks,
        ) {
            HoldoutCheckState(state = state, onIntent = onIntent, onTownOpen = onTownOpen)
        }
    }
}

@Composable
private fun HoldoutCheckState(
    state: HoldoutCheckUiState,
    onIntent: (HoldoutCheckIntent) -> Unit,
    onTownOpen: () -> Unit,
) {
    when (state) {
        HoldoutCheckUiState.Loading -> Unit
        HoldoutCheckUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.placement_holdout_failed),
            actionLabel = fixedCopyResource(R.string.placement_retry),
            onAction = { onIntent(HoldoutCheckIntent.RetryTapped) },
        )
        HoldoutCheckUiState.NotOpen -> HoldoutCheckEnd(
            line = R.string.placement_holdout_refused,
            onTownOpen = onTownOpen,
        )
        is HoldoutCheckUiState.Due -> HoldoutCheckDue(due = state, onIntent = onIntent)
        is HoldoutCheckUiState.Asking -> HoldoutCheckAsking(asking = state, onIntent = onIntent)
        HoldoutCheckUiState.Done -> HoldoutCheckEnd(line = R.string.placement_holdout_done, onTownOpen = onTownOpen)
    }
}

@Composable
private fun HoldoutCheckEnd(line: Int, onTownOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameText(
            text = fixedCopyResource(line),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        MyGameButton(
            label = fixedCopyResource(R.string.placement_to_town),
            isBusy = false,
            busyDescription = fixedCopyResource(R.string.placement_sending),
            onClick = onTownOpen,
        )
    }
}

private val holdoutCheckBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.placeCard, MyGameSizes.secondary, MyGameSizes.secondary, MyGameSizes.action),
)

private val previewHouse: PlacementItem = PlacementItem(
    word = WordId("word-24"),
    text = "house",
    choices = listOf(
        PlacementChoice(ChoiceId("0a1b2c3d"), "perro"),
        PlacementChoice(ChoiceId("4e5f6a7b"), "casa"),
        PlacementChoice(ChoiceId("8c9d0e1f"), "caminar"),
        PlacementChoice(ChoiceId("2a3b4c5d"), "agua"),
    ),
)

private val previewAsking: HoldoutCheckUiState.Asking = HoldoutCheckUiState.Asking(
    band = PlacementBand.First,
    week = HoldoutCheckWeek.Eighth,
    items = listOf(previewHouse, previewHouse.copy(word = WordId("word-25"))),
    shownIndex = 1,
    chosen = mapOf(WordId("word-24") to ChoiceId("4e5f6a7b"), WordId("word-25") to ChoiceId("4e5f6a7b")),
    request = HoldoutCheckRequest.Idle,
)

private val previewDue: HoldoutCheckUiState.Due =
    HoldoutCheckUiState.Due(PlacementBand.First, HoldoutCheckWeek.Eighth, HoldoutCheckRequest.Idle)

private class HoldoutCheckScreenStates : PreviewParameterProvider<HoldoutCheckUiState> {
    override val values: Sequence<HoldoutCheckUiState> = sequenceOf(
        previewDue,
        previewAsking.copy(shownIndex = 0, chosen = emptyMap()),
        previewAsking.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Answers)),
        HoldoutCheckUiState.Done,
        previewDue.copy(request = HoldoutCheckRequest.Refused),
        previewAsking.copy(request = HoldoutCheckRequest.Refused),
        HoldoutCheckUiState.Failed,
        HoldoutCheckUiState.NotOpen,
    )
}

@PreviewMyGame
@Composable
private fun HoldoutCheckScreenPreview(@PreviewParameter(HoldoutCheckScreenStates::class) state: HoldoutCheckUiState) {
    MyGamePreviewSurface {
        HoldoutCheckScreen(state = state, onIntent = {}, onTownOpen = {})
    }
}
