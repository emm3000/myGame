package com.emm.mygame.feature.learning.reviews

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameWayOn
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.feature.learning.R

@Composable
internal fun ReviewWayOn(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit, onDone: () -> Unit) {
    when (state) {
        ReviewUiState.Loading, ReviewUiState.Failed -> Unit
        is ReviewUiState.Reviewing -> ReviewingWayOn(reviewing = state, onIntent = onIntent)
        ReviewUiState.NoCards,
        is ReviewUiState.NothingDue,
        is ReviewUiState.LessonReady,
        -> MyGameWayOn(
            label = fixedLabel(R.string.review_continue),
            isBusy = false,
            busyDescription = waitingLabel(),
            onClick = onDone,
        )
    }
}

@Composable
private fun ReviewingWayOn(reviewing: ReviewUiState.Reviewing, onIntent: (ReviewIntent) -> Unit) {
    val intent: ReviewIntent = reviewing.goIntent()
    MyGameWayOn(
        label = fixedLabel(goLabelOf(reviewing)),
        isBusy = reviewing.isBusy,
        busyDescription = waitingLabel(),
        onClick = { onIntent(intent) },
        blockedReason = reviewing.card.blockOf()?.takeUnless { reviewing.isRated }?.let { reason: Int ->
            fixedLabel(reason)
        },
        verdict = { ReviewStepLine(reviewing = reviewing, onIntent = onIntent) },
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
private fun waitingLabel(): MyGameLabel = chromeResource(R.string.review_waiting)
