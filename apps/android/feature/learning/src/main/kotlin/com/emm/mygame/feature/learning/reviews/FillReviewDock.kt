package com.emm.mygame.feature.learning.reviews

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.ui.FillTaskDock
import com.emm.mygame.core.ui.FollowTownDock
import com.emm.mygame.core.ui.TaskDock
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.feature.learning.R

@Composable
internal fun FillReviewDock(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit, task: TaskDockHook) {
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
private fun reviewingDock(reviewing: ReviewUiState.Reviewing, onIntent: (ReviewIntent) -> Unit): TaskDock = TaskDock(
    step = chromeResource(R.string.review_due_count, "count" to reviewing.dueCount.toString()),
    go = reviewGoOf(reviewing, onIntent),
    notice = { ReviewStepLine(reviewing = reviewing, onIntent = onIntent) },
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
            fixedLabel(reason)
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
private fun waitingLabel(): MyGameLabel = chromeResource(R.string.review_waiting)
