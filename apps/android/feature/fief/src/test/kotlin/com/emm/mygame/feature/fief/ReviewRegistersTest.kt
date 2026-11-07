package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReviewRegistersTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val rightHome: ReviewVerdict = ReviewVerdict.Correct(
        word = "home",
        gloss = "casa",
        dueAt = firstReadAt + 10.minutes,
        earnedSkill = null,
    )

    private val wrongHome: ReviewVerdict = ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = firstReadAt)

    @Test
    fun `plays nothing on the first read`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))

        viewModel.state.test {
            assertEquals(false, awaitReviewing().isDealtFromStack)
        }
    }

    @Test
    fun `deals the next card on a right answer`() = runTest {
        assertEquals(true, dealtAfter(rightHome))
    }

    @Test
    fun `changes the card in place after a wrong answer`() = runTest {
        assertEquals(false, dealtAfter(wrongHome))
    }

    private suspend fun TestScope.dealtAfter(verdict: ReviewVerdict): Boolean {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))
        learning.answerReview(ReviewAnswerResult.Answered(verdict))
        learning.answerRead(dueNow(schoolRecognition))
        var isDealt: Boolean = false
        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { step: ReviewUiState.ReviewStep ->
                step is ReviewUiState.ReviewStep.Correct || step is ReviewUiState.ReviewStep.Wrong
            }
            viewModel.onIntent(ReviewIntent.NextTapped)
            isDealt = awaitReviewing().isDealtFromStack
        }
        return isDealt
    }
}
