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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
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
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementChoice
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.network.WordId

@Composable
fun PlacementScreen(
    state: PlacementUiState,
    onIntent: (PlacementIntent) -> Unit,
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
            text = stringResource(R.string.placement_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == PlacementUiState.Loading,
            loadingLabel = stringResource(R.string.placement_loading),
            blocks = placementBlocks,
        ) {
            PlacementState(state = state, onIntent = onIntent, onTownOpen = onTownOpen)
        }
    }
}

@Composable
private fun PlacementState(state: PlacementUiState, onIntent: (PlacementIntent) -> Unit, onTownOpen: () -> Unit) {
    when (state) {
        PlacementUiState.Loading -> Unit
        PlacementUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.placement_failed),
            actionLabel = stringResource(R.string.placement_retry),
            onAction = { onIntent(PlacementIntent.RetryTapped) },
        )
        is PlacementUiState.Offered -> PlacementOffered(offered = state, onIntent = onIntent)
        is PlacementUiState.Asking -> PlacementAsking(asking = state, onIntent = onIntent)
        is PlacementUiState.Closed -> PlacementResult(closed = state, onTownOpen = onTownOpen)
    }
}

private val placementBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
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

private val previewPassed: PlacementScore = PlacementScore(PlacementBand.First, score = 30, isPlacedOut = true)

private class PlacementScreenStates : PreviewParameterProvider<PlacementUiState> {
    override val values: Sequence<PlacementUiState> = sequenceOf(
        PlacementUiState.Failed,
        PlacementUiState.Offered(PlacementRequest.Idle),
        PlacementUiState.Asking(
            band = PlacementBand.Second,
            items = listOf(previewHouse, previewHouse.copy(word = WordId("word-25"))),
            scores = listOf(previewPassed),
            shownIndex = 0,
            chosen = mapOf(WordId("word-24") to ChoiceId("4e5f6a7b")),
            request = PlacementRequest.Idle,
        ),
        PlacementUiState.Closed(
            listOf(previewPassed, PlacementScore(PlacementBand.Second, score = 21, isPlacedOut = false)),
        ),
        PlacementUiState.Closed(emptyList()),
    )
}

@PreviewMyGame
@Composable
private fun PlacementScreenPreview(@PreviewParameter(PlacementScreenStates::class) state: PlacementUiState) {
    MyGamePreviewSurface {
        PlacementScreen(state = state, onIntent = {}, onTownOpen = {})
    }
}
