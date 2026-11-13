package com.emm.mygame.feature.review

import app.cash.turbine.test
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewHintResult
import com.emm.mygame.core.network.ReviewHintWord
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReviewSupportViewModelTest {

    @get:Rule
    val mainDispatcherRule: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `opens the support of the tapped span`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(walkRecognition(caminarOnTap)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            assertEquals(1, awaitReviewing().card.openSpan)
        }
    }

    @Test
    fun `closes the shown support on a second tap of its word`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(walkRecognition(caminarOnTap)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            assertEquals(null, awaitReviewing().card.openSpan)
        }
    }

    @Test
    fun `moves the shown support to the next word tapped`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(walkRecognition(caminarOnTap)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 3))
            assertEquals(3, awaitReviewing().card.openSpan)
        }
    }

    @Test
    fun `chooses no answer when a support is tapped on a recognition`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(walkRecognition(caminarOnTap)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            assertEquals(null, (awaitReviewing().card as ReviewUiState.ReviewCard.Recognition).chosen)
        }
    }

    @Test
    fun `hides the shown support on the next card`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(goesRecall, walkRecognition(caminarOnTap)))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome))
        learning.answerRead(dueNow(walkRecognition(caminarOnTap)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            assertEquals(1, awaitReviewing().card.openSpan)
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
            viewModel.onIntent(ReviewIntent.NextTapped)
            val next: ReviewUiState.Reviewing = awaitReviewing()
            assertEquals(schoolRecognition.wordId, next.card.wordId)
            assertEquals(null, next.card.openSpan)
        }
    }

    @Test
    fun `keeps the shown support beside the verdict`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(goesRecall))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome))
        learning.answerRead(dueNow())

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            assertEquals(1, awaitReviewing().card.openSpan)
        }
    }

    private val correctHome: ReviewVerdict =
        ReviewVerdict.Correct(word = "home", gloss = "casa", dueAt = firstReadAt + 10.minutes, earnedSkill = null)

    @Test
    fun `keeps a support opened while the hint is asked`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(goesRecall))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Hinting }
            viewModel.onIntent(ReviewIntent.SupportTapped(spanIndex = 1))
            awaitReviewing()
            learning.answerHint(ReviewHintResult.Hinted(goesHint))
            val hinted: ReviewUiState.Reviewing = awaitStep { it == ReviewUiState.ReviewStep.Answering }
            assertEquals(1, hinted.card.openSpan)
        }
    }
}

private val goesHint: ReviewHint = ReviewHint(words = listOf(ReviewHintWord(firstLetter = "g", letterCount = 4)))
