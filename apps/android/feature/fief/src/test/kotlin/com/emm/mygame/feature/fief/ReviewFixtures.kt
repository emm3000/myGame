package com.emm.mygame.feature.fief

import androidx.lifecycle.viewModelScope
import app.cash.turbine.ReceiveTurbine
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.DueReview
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope

internal fun TestScope.openReview(
    learning: FakeLearningRepository,
    deviceNow: Instant = firstReadAt,
): ReviewViewModel {
    val viewModel: ReviewViewModel = ReviewViewModel(learning, TestClock(testScheduler, deviceNow))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal suspend fun ReceiveTurbine<ReviewUiState>.awaitReviewing(): ReviewUiState.Reviewing {
    var item: ReviewUiState = awaitItem()
    while (item !is ReviewUiState.Reviewing) item = awaitItem()
    return item
}

internal suspend fun ReceiveTurbine<ReviewUiState>.awaitStep(
    isWanted: (ReviewUiState.ReviewStep) -> Boolean,
): ReviewUiState.Reviewing {
    var reviewing: ReviewUiState.Reviewing = awaitReviewing()
    while (!isWanted(reviewing.step)) reviewing = awaitReviewing()
    return reviewing
}

internal fun dueNow(vararg due: DueReview): ReviewsReadResult =
    ReviewsReadResult.Read(DueReviews(due = due.toList(), nextDueAt = null, readAt = firstReadAt))

internal fun nothingDueUntil(nextDueAt: Instant): ReviewsReadResult =
    ReviewsReadResult.Read(DueReviews(due = emptyList(), nextDueAt = nextDueAt, readAt = firstReadAt))

internal val schoolRecognition: DueReview.Recognition = DueReview.Recognition(
    wordId = WordId("lesson-1-2"),
    lesson = LessonId("lesson-1"),
    dueAt = firstReadAt,
    word = "school",
    frame = "The kids walk to school.",
    choices = listOf(
        ReviewChoice(id = ChoiceId("0a1b2c3d"), gloss = "dinero"),
        ReviewChoice(id = ChoiceId("4e5f6a7b"), gloss = "escuela"),
    ),
)

internal val homeRecall: DueReview.Recall = DueReview.Recall(
    wordId = WordId("lesson-1-1"),
    lesson = LessonId("lesson-1"),
    dueAt = firstReadAt,
    gloss = "casa",
    gappedFrame = "She goes ___ at six.",
)
