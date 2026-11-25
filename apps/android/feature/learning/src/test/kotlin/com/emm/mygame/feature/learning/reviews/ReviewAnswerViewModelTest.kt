package com.emm.mygame.feature.learning.reviews

import app.cash.turbine.test
import com.emm.mygame.core.model.learning.ReviewAnswerResult
import com.emm.mygame.core.model.learning.ReviewVerdict
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.minutes

class ReviewAnswerViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `draws a recognition card with its word, its frame and its choices`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            assertEquals(
                ReviewUiState.ReviewCard.Recognition(
                    wordId = schoolRecognition.wordId,
                    word = "school",
                    frame = plainFrame("The kids walk to school."),
                    choices = schoolRecognition.choices,
                    chosen = null,
                    openSpan = null,
                ),
                awaitReviewing().card,
            )
        }
    }

    @Test
    fun `sends the chosen choice as the answer of a recognition`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.ChoiceChosen(ChoiceId("4e5f6a7b")))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Checking }
        }
        assertEquals(
            listOf(FakeLearningRepository.AnswerRequest(schoolRecognition.wordId, "4e5f6a7b")),
            learning.answers,
        )
    }

    @Test
    fun `sends nothing for a recognition with no choice`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            expectNoEvents()
        }
        assertEquals(emptyList<FakeLearningRepository.AnswerRequest>(), learning.answers)
    }

    @Test
    fun `sends the typed answer of a recall exactly as typed`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("  Home "))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Checking }
        }
        assertEquals("  Home ", learning.answers.single().answer)
    }

    @Test
    fun `sends nothing for a recall with an empty field`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            expectNoEvents()
        }
        assertEquals(emptyList<FakeLearningRepository.AnswerRequest>(), learning.answers)
    }

    @Test
    fun `sends one answer while the first one waits`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            viewModel.onIntent(ReviewIntent.CheckTapped)
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Checking }
        }
        assertEquals(1, learning.answers.size)
        assertEquals(emptyList<WordId>(), learning.hints)
    }

    @Test
    fun `keeps the typed answer after a near-miss`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Answered(ReviewVerdict.NearMiss))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("hme"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            val nearMiss: ReviewUiState.Reviewing = awaitStep { it == ReviewUiState.ReviewStep.NearMiss }
            assertEquals("hme", (nearMiss.card as ReviewUiState.ReviewCard.Recall).typed)
        }
    }

    @Test
    fun `shows the correct form after a wrong answer`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        val wrong: ReviewVerdict = ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = firstReadAt + 1.minutes)
        learning.answerReview(ReviewAnswerResult.Answered(wrong))
        learning.answerRead(dueNow())

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("house"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            val rated: ReviewUiState.Reviewing = awaitStep { it is ReviewUiState.ReviewStep.Wrong }
            assertEquals(ReviewUiState.ReviewStep.Wrong(correct = "home"), rated.step)
            assertEquals("house", rated.card.shownAnswer)
        }
    }

    @Test
    fun `shows the right gloss beside the chosen one after a wrong recognition`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(schoolRecognition))
        val wrong: ReviewVerdict =
            ReviewVerdict.Wrong(word = "school", gloss = "escuela", dueAt = firstReadAt + 1.minutes)
        learning.answerReview(ReviewAnswerResult.Answered(wrong))
        learning.answerRead(dueNow())

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.ChoiceChosen(ChoiceId("0a1b2c3d")))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            val rated: ReviewUiState.Reviewing = awaitStep { it is ReviewUiState.ReviewStep.Wrong }
            assertEquals(ReviewUiState.ReviewStep.Wrong(correct = "escuela"), rated.step)
            assertEquals("dinero", rated.card.shownAnswer)
        }
    }
}
