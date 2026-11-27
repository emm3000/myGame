package com.emm.mygame.feature.holdout

import androidx.annotation.StringRes
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSunkenCard
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.fixedCopyResource

internal const val HOLDOUT_CHECK_END_CARD: String = "holdout_check_end_card"

@Composable
internal fun HoldoutCheckScreen(
    state: HoldoutCheckUiState,
    onIntent: (HoldoutCheckIntent) -> Unit,
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
            text = fixedCopyResource(R.string.holdout_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == HoldoutCheckUiState.Loading,
            loadingLabel = fixedCopyResource(R.string.holdout_loading),
            blocks = holdoutCheckBlocks,
        ) {
            HoldoutCheckState(state = state, onIntent = onIntent)
        }
        HoldoutCheckWayOn(state = state, onIntent = onIntent, onDone = onDone)
    }
}

@Composable
private fun HoldoutCheckState(state: HoldoutCheckUiState, onIntent: (HoldoutCheckIntent) -> Unit) {
    when (state) {
        HoldoutCheckUiState.Loading -> Unit
        HoldoutCheckUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.holdout_failed),
            actionLabel = fixedCopyResource(R.string.holdout_retry),
            onAction = { onIntent(HoldoutCheckIntent.RetryTapped) },
        )
        HoldoutCheckUiState.NotOpen -> HoldoutCheckEnd(line = R.string.holdout_refused)
        is HoldoutCheckUiState.Due -> HoldoutCheckDue(due = state, onIntent = onIntent)
        is HoldoutCheckUiState.Asking -> HoldoutCheckAsking(asking = state, onIntent = onIntent)
        HoldoutCheckUiState.Answered -> HoldoutCheckEnd(line = R.string.holdout_done)
        HoldoutCheckUiState.Skipped -> HoldoutCheckEnd(line = R.string.holdout_skipped)
    }
}

@Composable
private fun HoldoutCheckEnd(@StringRes line: Int, modifier: Modifier = Modifier) {
    MyGameSunkenCard(modifier = modifier.testTag(HOLDOUT_CHECK_END_CARD)) {
        MyGameText(
            text = fixedCopyResource(line),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
    }
}

private val holdoutCheckBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.placeCard, MyGameSizes.secondary, MyGameSizes.secondary, MyGameSizes.action),
)
