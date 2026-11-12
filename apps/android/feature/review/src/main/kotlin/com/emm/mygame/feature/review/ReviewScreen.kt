package com.emm.mygame.feature.review

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
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.progressBarRangeInfo
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
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.ui.icuStringResource
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

@Composable
fun ReviewScreen(
    state: ReviewUiState,
    onIntent: (ReviewIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
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
            text = stringResource(R.string.review_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == ReviewUiState.Loading,
            loadingLabel = stringResource(R.string.review_loading),
            blocks = reviewBlocks,
        ) {
            ReviewState(state = state, onIntent = onIntent, onLessonOpen = onLessonOpen, onTownOpen = onTownOpen)
        }
    }
}

@Composable
private fun ReviewState(
    state: ReviewUiState,
    onIntent: (ReviewIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onTownOpen: () -> Unit,
) {
    when (state) {
        ReviewUiState.Loading -> Unit
        ReviewUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.review_failed),
            actionLabel = stringResource(R.string.review_retry),
            onAction = { onIntent(ReviewIntent.RetryTapped) },
        )
        ReviewUiState.NoCards -> ReviewEnd(line = stringResource(R.string.review_no_cards), onTownOpen = onTownOpen)
        is ReviewUiState.NothingDue -> ReviewEnd(
            line = stringResource(R.string.review_nothing_due),
            onTownOpen = onTownOpen,
            nextReview = icuStringResource(
                R.string.review_next_due,
                "due" to finishLabelOf(state.remaining, state.dueAt),
            ),
            path = state.path,
        )
        is ReviewUiState.LessonReady -> LessonReady(ready = state, onLessonOpen = onLessonOpen)
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
        MyGameText(
            text = icuStringResource(R.string.review_due_count, "count" to reviewing.dueCount.toString()),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        ReviewProgress(reviewing = reviewing)
        when (card) {
            is ReviewUiState.ReviewCard.Recognition ->
                RecognitionCard(card = card, reviewing = reviewing, onIntent = onIntent)
            is ReviewUiState.ReviewCard.Recall ->
                RecallCard(card = card, reviewing = reviewing, onIntent = onIntent)
        }
        ReviewStepLine(reviewing = reviewing, onIntent = onIntent)
        ReviewAction(reviewing = reviewing, onIntent = onIntent)
        if (card is ReviewUiState.ReviewCard.Recall && !reviewing.isRated) {
            HintLine(card = card, isBusy = reviewing.isBusy, onIntent = onIntent)
        }
    }
}

@Composable
private fun ReviewProgress(reviewing: ReviewUiState.Reviewing, modifier: Modifier = Modifier) {
    val done: Int = reviewing.walked + if (reviewing.isRated) 1 else 0
    val filled: Float = done.toFloat() / (reviewing.walked + reviewing.dueCount)
    MyGameTrack(
        filled = filled,
        color = MyGameTheme.colors.action,
        modifier = modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
    )
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
    val isRecallEmpty: Boolean = (reviewing.card as? ReviewUiState.ReviewCard.Recall)?.typed?.isEmpty() == true
    MyGameButton(
        label = stringResource(if (isChecking) R.string.review_checking else R.string.review_check),
        isBusy = reviewing.isBusy,
        busyDescription = stringResource(R.string.building_waiting),
        onClick = { onIntent(ReviewIntent.CheckTapped) },
        modifier = modifier,
        blockedReason = if (isRecallEmpty) stringResource(R.string.review_check_empty) else null,
    )
}

private val previewRecognition: ReviewUiState.ReviewCard.Recognition = ReviewUiState.ReviewCard.Recognition(
    wordId = WordId("lesson-1-2"),
    word = "school",
    frame = "The kids walk to school.",
    choices = listOf(
        ReviewChoice(id = ChoiceId("0a1b2c3d"), gloss = "dinero"),
        ReviewChoice(id = ChoiceId("4e5f6a7b"), gloss = "escuela"),
        ReviewChoice(id = ChoiceId("8c9d0e1f"), gloss = "granja"),
    ),
    chosen = null,
)

private val previewRecall: ReviewUiState.ReviewCard.Recall = ReviewUiState.ReviewCard.Recall(
    wordId = WordId("lesson-1-1"),
    gloss = "casa",
    gappedFrame = "She goes ___ at six.",
    typed = "h",
    hint = ReviewHint(firstLetter = "h", letterCount = 4),
)

private val previewReviewing: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
    walked = 1,
    dueCount = 4,
    card = previewRecognition,
    step = ReviewUiState.ReviewStep.Answering,
    isDealtFromStack = false,
)

private class ReviewUiStates : PreviewParameterProvider<ReviewUiState> {

    override val values: Sequence<ReviewUiState> = sequenceOf(
        previewReviewing,
        previewReviewing.copy(card = previewRecall),
        previewReviewing.copy(
            card = previewRecognition.copy(chosen = ChoiceId("4e5f6a7b")),
            step = ReviewUiState.ReviewStep.Correct(
                skill = ReviewUiState.SkillLine(
                    resource = TownResourceKind.Food,
                    level = 2,
                    ratePercent = 10,
                    rates = ReviewUiState.SkillRates(before = 60L, after = 66L),
                    words = listOf("school", "home"),
                ),
            ),
        ),
        previewReviewing.copy(
            card = previewRecall.copy(typed = "house", hint = null),
            step = ReviewUiState.ReviewStep.Wrong(correct = "home"),
        ),
        previewReviewing.copy(step = ReviewUiState.ReviewStep.Unreachable),
        ReviewUiState.NothingDue(
            remaining = 3.hours,
            dueAt = Instant.parse("2026-11-05T13:00:00Z"),
            path = ReviewUiState.LessonPath(
                number = 1,
                counts = SchoolPathCounts(held = 5, read = 5, reviewed = 3, learned = 1),
            ),
        ),
        ReviewUiState.LessonReady(lesson = LessonId("lesson-2"), number = 2),
        ReviewUiState.NoCards,
        ReviewUiState.Loading,
        ReviewUiState.Failed,
    )
}

@PreviewMyGame
@Composable
private fun ReviewScreenPreview(@PreviewParameter(ReviewUiStates::class) state: ReviewUiState) {
    MyGamePreviewSurface {
        ReviewScreen(state = state, onIntent = {}, onLessonOpen = {}, onTownOpen = {})
    }
}
