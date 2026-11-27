package com.emm.mygame.feature.learning.reviews

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.control.MyGameErrorBanner
import com.emm.mygame.core.designsystem.control.MyGameTrack
import com.emm.mygame.core.designsystem.frame.MyGameSkeleton
import com.emm.mygame.core.designsystem.frame.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.learning.R

@Composable
internal fun ReviewScreen(
    state: ReviewUiState,
    onIntent: (ReviewIntent) -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shownCard: Any? = (state as? ReviewUiState.Reviewing)?.let { shown: ReviewUiState.Reviewing ->
        shown.card.wordId to shown.walked
    }
    val scroll: ScrollState = rememberSaveable(shownCard, saver = ScrollState.Saver) { ScrollState(initial = 0) }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(scroll)
            .padding(start = MyGameSpacing.step4, end = MyGameSpacing.step4, top = MyGameSpacing.step8)
            .padding(bottom = MyGameSpacing.step8),
    ) {
        ReviewHeader(dueCount = (state as? ReviewUiState.Reviewing)?.dueCount)
        MyGameSkeleton(
            isLoading = state == ReviewUiState.Loading,
            loadingLabel = chromeResource(R.string.review_loading).spoken,
            blocks = reviewBlocks,
        ) {
            ReviewState(state = state, onIntent = onIntent)
        }
        ReviewWayOn(state = state, onIntent = onIntent, onDone = onDone)
    }
}

@Composable
private fun ReviewState(
    state: ReviewUiState,
    onIntent: (ReviewIntent) -> Unit,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    when (state) {
        ReviewUiState.Loading -> Unit
        ReviewUiState.Failed -> MyGameErrorBanner(
            message = copy.chrome(R.string.review_failed),
            actionLabel = copy.chrome(R.string.review_retry),
            onAction = { onIntent(ReviewIntent.RetryTapped) },
        )
        ReviewUiState.NoCards -> ReviewEnd(line = copy.chrome(R.string.review_no_cards))
        is ReviewUiState.NothingDue -> ReviewEnd(line = copy.chrome(R.string.review_nothing_due), path = state.path)
        is ReviewUiState.LessonReady -> LessonReady(ready = state)
        is ReviewUiState.Reviewing -> Reviewing(reviewing = state, onIntent = onIntent)
    }
}

private val reviewBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.control, MyGameSizes.placeCard, MyGameSizes.thumbnail, MyGameSizes.action),
)

@Composable
private fun Reviewing(
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val card: ReviewUiState.ReviewCard = reviewing.card
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        ReviewProgress(reviewing = reviewing)
        when (card) {
            is ReviewUiState.ReviewCard.Recognition ->
                RecognitionCard(card = card, reviewing = reviewing, onIntent = onIntent)
            is ReviewUiState.ReviewCard.Recall ->
                RecallCard(card = card, reviewing = reviewing, onIntent = onIntent)
        }
        if (card is ReviewUiState.ReviewCard.Recall && !reviewing.isRated) {
            HintLine(card = card, isBusy = reviewing.isBusy, onIntent = onIntent)
        }
    }
}

@Composable
private fun ReviewHeader(dueCount: Int?, modifier: Modifier = Modifier) {
    FlowRow(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        itemVerticalAlignment = Alignment.Bottom,
        modifier = modifier.fillMaxWidth(),
    ) {
        MyGameText(
            label = chromeResource(R.string.review_title),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        dueCount?.let { count: Int ->
            MyGameText(
                label = chromeResource(R.string.review_due_count, "count" to count.toString()),
                style = MyGameTypography.meta,
                color = MyGameTheme.colors.inkMuted,
            )
        }
    }
}

@Composable
private fun ReviewProgress(reviewing: ReviewUiState.Reviewing, modifier: Modifier = Modifier) {
    val done: Int = reviewing.walked + if (reviewing.isRated) 1 else 0
    val filled: Float = done.toFloat() / (reviewing.walked + reviewing.dueCount)
    MyGameTrack(
        filled = filled,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
    )
}
