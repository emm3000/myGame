package com.emm.mygame.feature.fief

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
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
fun ReviewScreen(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit, modifier: Modifier = Modifier) {
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
            text = stringResource(R.string.review_title),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        when (state) {
            ReviewUiState.Loading -> Line(text = stringResource(R.string.review_loading))
            ReviewUiState.Failed -> MyGameErrorBanner(
                message = stringResource(R.string.review_failed),
                actionLabel = stringResource(R.string.fief_retry),
                onAction = { onIntent(ReviewIntent.RetryTapped) },
            )
            ReviewUiState.NoCards -> Line(text = stringResource(R.string.review_no_cards))
            is ReviewUiState.NothingDue -> NothingDue(state = state)
            is ReviewUiState.Reviewing -> Reviewing(reviewing = state, onIntent = onIntent)
        }
    }
}

@Composable
private fun NothingDue(state: ReviewUiState.NothingDue, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        Line(text = stringResource(R.string.review_nothing_due))
        MyGameText(
            text = stringResource(R.string.review_next_due, finishLabelOf(state.remaining, state.dueAt)),
            style = MyGameTypography.action,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun Reviewing(
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.review_due_count, reviewing.dueCount),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        Card {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
                modifier = Modifier.padding(vertical = MyGameSpacing.step4),
            ) {
                when (val card: ReviewUiState.ReviewCard = reviewing.card) {
                    is ReviewUiState.ReviewCard.Recognition ->
                        RecognitionCard(card = card, reviewing = reviewing, onIntent = onIntent)
                    is ReviewUiState.ReviewCard.Recall ->
                        RecallCard(card = card, reviewing = reviewing, onIntent = onIntent)
                }
                ReviewStepLine(reviewing = reviewing, onIntent = onIntent)
                ReviewAction(reviewing = reviewing, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun ReviewAction(
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (reviewing.isRated) {
        MyGameButton(
            label = stringResource(R.string.review_next_card),
            isBusy = false,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(ReviewIntent.NextTapped) },
            modifier = modifier,
        )
        return
    }
    val isChecking: Boolean = reviewing.step == ReviewUiState.ReviewStep.Checking
    MyGameButton(
        label = stringResource(if (isChecking) R.string.review_checking else R.string.review_check),
        isBusy = reviewing.isBusy,
        busyDescription = stringResource(R.string.building_waiting),
        onClick = { onIntent(ReviewIntent.CheckTapped) },
        modifier = modifier,
    )
}

@Composable
private fun Line(text: String, modifier: Modifier = Modifier) {
    MyGameText(text = text, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted, modifier = modifier)
}
