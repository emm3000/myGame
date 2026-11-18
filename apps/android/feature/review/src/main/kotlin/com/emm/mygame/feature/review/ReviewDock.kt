package com.emm.mygame.feature.review

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameDockLine
import com.emm.mygame.core.designsystem.MyGameDockLineText
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun ReviewDock(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit, task: TaskDockHook) {
    val currentIntent: State<(ReviewIntent) -> Unit> = rememberUpdatedState(onIntent)
    val startReviews: () -> Unit = remember { { currentIntent.value(ReviewIntent.ReviewsStartTapped) } }
    when (state) {
        ReviewUiState.Loading -> Unit
        is ReviewUiState.Reviewing -> FillTaskDock(hook = task, dock = reviewingDock(state, onIntent))
        ReviewUiState.Failed,
        ReviewUiState.NoCards,
        is ReviewUiState.NothingDue,
        is ReviewUiState.LessonReady,
        -> FollowTownDock(hook = task, onReviewsStart = startReviews)
    }
}

@Composable
internal fun FoldedReviewLine(
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val requester: BringIntoViewRequester = remember { BringIntoViewRequester() }
    LaunchedEffect(reviewing.card.wordId, reviewing.step) { requester.bringIntoView() }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.bringIntoViewRequester(requester),
    ) {
        MyGameDockLineText(line = reviewLineOf(reviewing), loadingLabel = waitingLabel())
        ReviewStepLine(reviewing = reviewing, onIntent = onIntent)
    }
}

internal fun ReviewUiState.Reviewing.goIntent(): ReviewIntent =
    if (isRated) ReviewIntent.NextTapped else ReviewIntent.CheckTapped

@Composable
private fun reviewingDock(reviewing: ReviewUiState.Reviewing, onIntent: (ReviewIntent) -> Unit): TaskDock = TaskDock(
    line = reviewLineOf(reviewing),
    go = reviewGoOf(reviewing, onIntent),
    notice = { ReviewStepLine(reviewing = reviewing, onIntent = onIntent) },
)

@Composable
private fun reviewLineOf(reviewing: ReviewUiState.Reviewing): MyGameDockLine = MyGameDockLine(
    title = chromeResource(R.string.review_title),
    step = chromeResource(R.string.review_due_count, "count" to reviewing.dueCount.toString()),
)

@Composable
private fun reviewGoOf(reviewing: ReviewUiState.Reviewing, onIntent: (ReviewIntent) -> Unit): MyGameDockGo {
    val intent: ReviewIntent = reviewing.goIntent()
    return MyGameDockGo(
        label = fixedLabel(goLabelOf(reviewing)),
        isBusy = reviewing.isBusy,
        busyDescription = waitingLabel(),
        onClick = { onIntent(intent) },
        blockedReason = reviewing.card.blockOf()?.takeUnless { reviewing.isRated }?.let { reason: Int ->
            fixedCopyResource(reason)
        },
    )
}

@StringRes
private fun goLabelOf(reviewing: ReviewUiState.Reviewing): Int = when {
    reviewing.isRated -> R.string.review_next_card
    reviewing.step == ReviewUiState.ReviewStep.Checking -> R.string.review_checking
    else -> R.string.review_check
}

@StringRes
private fun ReviewUiState.ReviewCard.blockOf(): Int? = when (this) {
    is ReviewUiState.ReviewCard.Recall -> R.string.review_check_empty.takeIf { typed.isEmpty() }
    is ReviewUiState.ReviewCard.Recognition -> R.string.review_check_no_choice.takeIf { chosen == null }
}

@Composable
private fun fixedLabel(@StringRes key: Int): MyGameLabel =
    MyGameLabel(text = fixedCopyResource(key), translation = null)

@Composable
private fun waitingLabel(): String = chromeResource(R.string.building_waiting).spoken
