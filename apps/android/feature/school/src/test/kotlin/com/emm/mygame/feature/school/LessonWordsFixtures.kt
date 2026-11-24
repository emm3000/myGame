package com.emm.mygame.feature.school

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlin.time.Instant

internal val homeWord: TownSnapshot.WordReading =
    wordReadingOf(word = "home", gloss = "hogar", frame = "This is my home.")

internal val waterWord: TownSnapshot.WordReading =
    wordReadingOf(word = "water", gloss = "agua", frame = "I drink water.")

internal val farmWord: TownSnapshot.WordReading =
    wordReadingOf(word = "farm", gloss = "granja", frame = "The farm is big.")

internal fun wordReadingOf(word: String, gloss: String, frame: String): TownSnapshot.WordReading =
    TownSnapshot.WordReading(
        word = word,
        frame = listOf(FrameSpan(text = frame, support = null)),
        support = WordSupport(shown = WordSupport.Shown.Beside, text = gloss, language = WordSupport.Language.Spanish),
    )

internal fun readReviewsOf(readFirst: List<LessonId> = emptyList()): ReviewsReadResult =
    ReviewsReadResult.Read(DueReviews(due = emptyList(), readFirst = readFirst, nextDueAt = null, readAt = readInstant))

internal fun readingOf(viewModel: LessonWordsViewModel): LessonWordsUiState.Reading =
    viewModel.state.value as LessonWordsUiState.Reading

internal fun TestScope.lessonWordsViewModelOf(
    towns: FakeTownRepository,
    learning: FakeLearningRepository,
    lesson: LessonId = firstLesson,
    walked: List<LessonId> = emptyList(),
    start: Instant = readInstant,
): LessonWordsViewModel {
    val clock: TestClock = TestClock(testScheduler, start)
    val viewModel: LessonWordsViewModel = LessonWordsViewModel(LessonWalk(lesson, walked), towns, learning, clock)
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal fun TestScope.lessonWordsReadingFrom(
    towns: FakeTownRepository,
    learning: FakeLearningRepository,
    town: TownSnapshot,
    readFirst: List<LessonId> = emptyList(),
    walked: List<LessonId> = emptyList(),
): LessonWordsViewModel {
    towns.answerRead(TownReadResult.Read(town))
    learning.answerRead(readReviewsOf(readFirst))
    val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning, walked = walked)
    runCurrent()
    return viewModel
}
