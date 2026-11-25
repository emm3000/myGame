package com.emm.mygame.feature.learning.reviews

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.FoldedTaskEnd
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.learning.R

@Composable
internal fun ReviewScreen(
    state: ReviewUiState,
    onIntent: (ReviewIntent) -> Unit,
    task: TaskDockHook,
    foldedDock: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    FillReviewDock(state = state, onIntent = onIntent, task = task)
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
        MyGameText(
            label = chromeResource(R.string.review_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == ReviewUiState.Loading,
            loadingLabel = chromeResource(R.string.review_loading).spoken,
            blocks = reviewBlocks,
        ) {
            ReviewState(state = state, onIntent = onIntent)
        }
        FoldedTaskEnd(
            hook = task,
            foldedDock = foldedDock,
            shownNotice = (state as? ReviewUiState.Reviewing)?.takeIf { shown: ReviewUiState.Reviewing ->
                shown.step.hasNotice()
            }?.let { shown: ReviewUiState.Reviewing -> shown.card.wordId to shown.step },
        )
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

private fun ReviewUiState.ReviewStep.hasNotice(): Boolean = when (this) {
    ReviewUiState.ReviewStep.Answering, ReviewUiState.ReviewStep.Checking, ReviewUiState.ReviewStep.Hinting -> false
    ReviewUiState.ReviewStep.NearMiss,
    is ReviewUiState.ReviewStep.Refused,
    ReviewUiState.ReviewStep.Unreachable,
    is ReviewUiState.ReviewStep.Correct,
    is ReviewUiState.ReviewStep.Wrong,
    -> true
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
private fun ReviewProgress(reviewing: ReviewUiState.Reviewing, modifier: Modifier = Modifier) {
    val done: Int = reviewing.walked + if (reviewing.isRated) 1 else 0
    val filled: Float = done.toFloat() / (reviewing.walked + reviewing.dueCount)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.review_due_count, "count" to reviewing.dueCount.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameTrack(
            filled = filled,
            color = MyGameTheme.colors.action,
            modifier = Modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
        )
    }
}
