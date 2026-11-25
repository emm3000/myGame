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
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun PlacementScreen(
    state: PlacementUiState,
    onIntent: (PlacementIntent) -> Unit,
    onDone: () -> Unit,
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
            text = fixedCopyResource(R.string.placement_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == PlacementUiState.Loading,
            loadingLabel = fixedCopyResource(R.string.placement_loading),
            blocks = placementBlocks,
        ) {
            PlacementState(state = state, onIntent = onIntent)
        }
        PlacementWayOn(state = state, onIntent = onIntent, onDone = onDone)
    }
}

@Composable
private fun PlacementState(state: PlacementUiState, onIntent: (PlacementIntent) -> Unit) {
    when (state) {
        PlacementUiState.Loading -> Unit
        PlacementUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.placement_failed),
            actionLabel = fixedCopyResource(R.string.placement_retry),
            onAction = { onIntent(PlacementIntent.RetryTapped) },
        )
        is PlacementUiState.Offered -> PlacementOffered(offered = state, onIntent = onIntent)
        is PlacementUiState.Asking -> PlacementAsking(asking = state, onIntent = onIntent)
        is PlacementUiState.Closed -> PlacementResult(closed = state)
    }
}

private val placementBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.placeCard, MyGameSizes.secondary, MyGameSizes.secondary, MyGameSizes.action),
)
