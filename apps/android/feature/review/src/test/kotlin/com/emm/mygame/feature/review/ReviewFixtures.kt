package com.emm.mygame.feature.review

import androidx.lifecycle.viewModelScope
import app.cash.turbine.ReceiveTurbine
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.DueReview
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.network.WordStanding
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope

internal fun TestScope.openReview(
    learning: FakeLearningRepository,
    deviceNow: Instant = firstReadAt,
    towns: FakeTownRepository = FakeTownRepository(),
): ReviewViewModel {
    val viewModel: ReviewViewModel = ReviewViewModel(learning, towns, TestClock(testScheduler, deviceNow))
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

internal fun dueNow(vararg due: DueReview): ReviewsReadResult = dueReading(due.toList(), readFirst = emptyList())

internal fun dueReading(due: List<DueReview>, readFirst: List<LessonId>): ReviewsReadResult =
    ReviewsReadResult.Read(DueReviews(due = due, readFirst = readFirst, nextDueAt = null, readAt = firstReadAt))

internal fun nothingDueUntil(nextDueAt: Instant): ReviewsReadResult = ReviewsReadResult.Read(
    DueReviews(due = emptyList(), readFirst = emptyList(), nextDueAt = nextDueAt, readAt = firstReadAt),
)

internal val firstReadAt: Instant = Instant.fromEpochMilliseconds(1_000_000)

internal val lessonTwo: LessonId = LessonId("lesson-2")

internal val coffeeRecall: DueReview.Recall = DueReview.Recall(
    wordId = WordId("lesson-2-1"),
    lesson = lessonTwo,
    dueAt = firstReadAt,
    gloss = "café",
    gappedFrame = "He drinks ___ at nine.",
)

internal fun lessonOf(id: String, standings: List<WordStanding>): TownSnapshot.Lesson = TownSnapshot.Lesson(
    id = LessonId(id),
    theme = "home",
    duration = 10.minutes,
    requiredSchoolLevel = 1,
    skill = TownSnapshot.LessonSkill(resource = TownResourceKind.Food, ratePercent = 5),
    isStudied = standings.any { standing: WordStanding -> standing != WordStanding.NotStarted },
    wordCount = standings.size,
    readings = emptyList(),
    standings = standings,
)

internal fun earnedOf(id: String): TownSnapshot.EarnedSkill =
    TownSnapshot.EarnedSkill(lesson = LessonId(id), resource = TownResourceKind.Food, ratePercent = 5)

internal fun townOf(
    lessons: List<TownSnapshot.Lesson>,
    skills: List<TownSnapshot.EarnedSkill> = emptyList(),
): TownReadResult = TownReadResult.Read(
    TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = emptyList(),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = lessons,
        skills = skills,
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
        lessonSlot = null,
        nextStep = NextStep.CaughtUp,
        nextDueAt = null,
        readAt = firstReadAt,
    ),
)

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
