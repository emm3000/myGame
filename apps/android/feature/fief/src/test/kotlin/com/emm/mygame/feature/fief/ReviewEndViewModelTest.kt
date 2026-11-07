package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.WordStanding
import com.emm.mygame.core.network.schoolPathCountsOf
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class ReviewEndViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val heldStandings: List<WordStanding> =
        listOf(WordStanding.Recognize, WordStanding.NotStarted, WordStanding.Hold)

    private val unreadStandings: List<WordStanding> = listOf(WordStanding.NotStarted, WordStanding.NotStarted)

    private val twoLessons: TownReadResult = townOf(
        lessons = listOf(lessonOf("lesson-1", heldStandings), lessonOf("lesson-2", unreadStandings)),
    )

    private val wrongHome: ReviewAnswerResult = ReviewAnswerResult.Answered(
        ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = firstReadAt + 1.minutes),
    )

    @Test
    fun `sends the player to the words when a lesson finishes during the reviews`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(twoLessons)
        learning.answerRead(dueNow(homeRecall))
        learning.answerRead(dueReading(listOf(coffeeRecall), readFirst = listOf(lessonTwo)))

        assertEquals(ReviewUiState.LessonReady(lesson = lessonTwo, number = 2), nextAfterOneAnswer(learning, towns))
    }

    @Test
    fun `stops with no lesson number while the town is unread`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        learning.answerRead(dueNow(homeRecall))
        learning.answerRead(dueReading(listOf(coffeeRecall), readFirst = listOf(lessonTwo)))

        assertEquals(
            ReviewUiState.LessonReady(lesson = lessonTwo, number = null),
            nextAfterOneAnswer(learning, FakeTownRepository()),
        )
    }

    @Test
    fun `stops with no lesson number when the town does not hold the lesson`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(townOf(lessons = listOf(lessonOf("lesson-1", heldStandings))))
        learning.answerRead(dueNow(homeRecall))
        learning.answerRead(dueReading(listOf(coffeeRecall), readFirst = listOf(lessonTwo)))

        assertEquals(ReviewUiState.LessonReady(lesson = lessonTwo, number = null), nextAfterOneAnswer(learning, towns))
    }

    @Test
    fun `names the finished lesson once the town is read`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val towns: FakeTownRepository = FakeTownRepository()
        learning.answerRead(dueNow(homeRecall))
        learning.answerRead(dueReading(listOf(coffeeRecall), readFirst = listOf(lessonTwo)))
        val viewModel: ReviewViewModel = answeredOnce(learning, towns)

        towns.answerRead(twoLessons)
        runCurrent()

        assertEquals(ReviewUiState.LessonReady(lesson = lessonTwo, number = 2), viewModel.state.value)
    }

    @Test
    fun `reviews the earlier cards before it stops at a finished lesson`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        learning.answerRead(dueNow(homeRecall, schoolRecognition))
        learning.answerRead(dueReading(listOf(schoolRecognition, coffeeRecall), readFirst = listOf(lessonTwo)))

        val next: ReviewUiState = nextAfterOneAnswer(learning, FakeTownRepository())

        assertEquals(schoolRecognition.wordId, (next as ReviewUiState.Reviewing).card.wordId)
    }

    @Test
    fun `never sends back a player who walked the words`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueReading(listOf(coffeeRecall), readFirst = listOf(lessonTwo)))

        viewModel.state.test {
            assertEquals(coffeeRecall.wordId, awaitReviewing().card.wordId)
        }
    }

    @Test
    fun `shows the school path at the review's end`() = runTest {
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(twoLessons)

        assertEquals(
            ReviewUiState.LessonPath(number = 1, counts = schoolPathCountsOf(heldStandings)),
            pathAtTheEnd(towns),
        )
    }

    @Test
    fun `shows the school path once the town is read`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val towns: FakeTownRepository = FakeTownRepository()
        val viewModel: ReviewViewModel = openReview(learning, towns = towns)
        learning.answerRead(nothingDueUntil(firstReadAt + 9.minutes))
        runCurrent()

        towns.answerRead(twoLessons)
        runCurrent()

        assertEquals(1, (viewModel.state.value as ReviewUiState.NothingDue).path?.number)
    }

    @Test
    fun `shows the path of the first lesson whose skill is not earned`() = runTest {
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(
            townOf(
                lessons = listOf(lessonOf("lesson-1", heldStandings), lessonOf("lesson-2", heldStandings)),
                skills = listOf(earnedOf("lesson-1")),
            ),
        )

        assertEquals(2, pathAtTheEnd(towns)?.number)
    }

    @Test
    fun `skips a lesson whose words the player holds none of`() = runTest {
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(
            townOf(lessons = listOf(lessonOf("lesson-1", unreadStandings), lessonOf("lesson-2", heldStandings))),
        )

        assertEquals(2, pathAtTheEnd(towns)?.number)
    }

    @Test
    fun `shows no school path once every studied lesson earned its skill`() = runTest {
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(
            townOf(lessons = listOf(lessonOf("lesson-1", heldStandings)), skills = listOf(earnedOf("lesson-1"))),
        )

        assertNull(pathAtTheEnd(towns))
    }

    @Test
    fun `shows no school path to a player with no town`() = runTest {
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(TownReadResult.NoTown)

        assertNull(pathAtTheEnd(towns))
    }

    @Test
    fun `reads the town again after a rated answer`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val towns: FakeTownRepository = FakeTownRepository()
        towns.answerRead(twoLessons)
        learning.answerRead(dueNow(homeRecall))
        learning.answerRead(dueNow())

        nextAfterOneAnswer(learning, towns)

        assertEquals(2, towns.readCount)
    }

    private suspend fun TestScope.nextAfterOneAnswer(
        learning: FakeLearningRepository,
        towns: FakeTownRepository,
    ): ReviewUiState = answeredOnce(learning, towns).state.value

    private suspend fun TestScope.answeredOnce(
        learning: FakeLearningRepository,
        towns: FakeTownRepository,
    ): ReviewViewModel {
        val viewModel: ReviewViewModel = openReview(learning, towns = towns)
        learning.answerReview(wrongHome)
        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("house"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { step: ReviewUiState.ReviewStep -> step is ReviewUiState.ReviewStep.Wrong }
            viewModel.onIntent(ReviewIntent.NextTapped)
            cancelAndIgnoreRemainingEvents()
        }
        return viewModel
    }

    private suspend fun TestScope.pathAtTheEnd(towns: FakeTownRepository): ReviewUiState.LessonPath? {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning, towns = towns)
        learning.answerRead(nothingDueUntil(firstReadAt + 9.minutes))
        var end: ReviewUiState = ReviewUiState.Loading
        viewModel.state.test {
            end = expectMostRecentItem()
        }
        return (end as ReviewUiState.NothingDue).path
    }
}
