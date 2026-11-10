package com.emm.mygame.feature.review

import app.cash.turbine.test
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.RaisedSkill
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewHintResult
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReviewViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val secondFoodLevel: RaisedSkill = RaisedSkill(
        resource = TownResourceKind.Food,
        level = 2,
        ratePercent = 5,
        ratePerHourBefore = 18.75,
        ratePerHourAfter = 19.6875,
        words = listOf("home", "school"),
    )

    private val foodSkillWithoutTown: RaisedSkill = RaisedSkill(
        resource = TownResourceKind.Food,
        level = 1,
        ratePercent = 5,
        ratePerHourBefore = null,
        ratePerHourAfter = null,
        words = listOf("home", "school"),
    )

    @Test
    fun `draws loading until the read answers`() = runTest {
        val viewModel: ReviewViewModel = openReview(FakeLearningRepository())

        viewModel.state.test {
            assertEquals(ReviewUiState.Loading, awaitItem())
        }
    }

    @Test
    fun `reads the due reviews from the player's reviews`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            assertEquals(schoolRecognition.wordId, awaitReviewing().card.wordId)
        }
        assertEquals(1, learning.readCount)
    }

    @Test
    fun `draws the failed read`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(ReviewsReadResult.Unreachable)

        viewModel.state.test {
            assertEquals(ReviewUiState.Failed, expectMostRecentItem())
        }
    }

    @Test
    fun `reads again on retry after a failed read`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(ReviewsReadResult.Unreachable)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            assertEquals(ReviewUiState.Failed, expectMostRecentItem())
            viewModel.onIntent(ReviewIntent.RetryTapped)
            awaitReviewing()
        }
        assertEquals(2, learning.readCount)
    }

    @Test
    fun `draws no card before lesson 1 enters its words`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow())

        viewModel.state.test {
            assertEquals(ReviewUiState.NoCards, expectMostRecentItem())
        }
    }

    @Test
    fun `draws nothing due with the next due instant projected with the read's gap`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val skewedDevice: Instant = firstReadAt - 30.seconds
        val viewModel: ReviewViewModel = openReview(learning, deviceNow = skewedDevice)
        learning.answerRead(nothingDueUntil(firstReadAt + 9.minutes))

        viewModel.state.test {
            assertEquals(
                ReviewUiState.NothingDue(remaining = 9.minutes, dueAt = skewedDevice + 9.minutes, path = null),
                expectMostRecentItem(),
            )
        }
    }

    @Test
    fun `reads again when the next review falls due`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(nothingDueUntil(firstReadAt + 2.seconds))
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            advanceTimeBy(2.seconds)
            runCurrent()
            awaitReviewing()
        }
        assertEquals(2, learning.readCount)
    }

    @Test
    fun `draws only the cards the api answers as due`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))

        viewModel.state.test {
            assertEquals(
                ReviewUiState.Reviewing(
                    walked = 0,
                    dueCount = 2,
                    card = ReviewUiState.ReviewCard.Recall(
                        wordId = homeRecall.wordId,
                        gloss = "casa",
                        gappedFrame = "She goes ___ at six.",
                        typed = "",
                        hint = null,
                    ),
                    step = ReviewUiState.ReviewStep.Answering,
                    isDealtFromStack = false,
                ),
                awaitReviewing(),
            )
        }
    }

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
                    frame = "The kids walk to school.",
                    choices = schoolRecognition.choices,
                    chosen = null,
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

    @Test
    fun `draws a correct answer with no skill earned`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null)))
        learning.answerRead(dueNow())

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Correct(skill = null),
                awaitStep { it is ReviewUiState.ReviewStep.Correct }.step,
            )
        }
    }

    @Test
    fun `draws the skill earned with its floored rates and its words`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = secondFoodLevel)))
        learning.answerRead(dueNow())

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Correct(
                    skill = ReviewUiState.SkillLine(
                        resource = TownResourceKind.Food,
                        level = 2,
                        ratePercent = 5,
                        rates = ReviewUiState.SkillRates(before = 18, after = 19),
                        words = listOf("home", "school"),
                    ),
                ),
                awaitStep { it is ReviewUiState.ReviewStep.Correct }.step,
            )
        }
    }

    @Test
    fun `draws the percent of the skill earned while the player holds no town`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = foodSkillWithoutTown)))
        learning.answerRead(dueNow())

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Correct(
                    skill = ReviewUiState.SkillLine(
                        resource = TownResourceKind.Food,
                        level = 1,
                        ratePercent = 5,
                        rates = null,
                        words = listOf("home", "school"),
                    ),
                ),
                awaitStep { it is ReviewUiState.ReviewStep.Correct }.step,
            )
        }
    }

    @Test
    fun `re-reads the reviews after an answer`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null)))
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
        }
        assertEquals(2, learning.readCount)
    }

    @Test
    fun `draws the reviews re-read after the answer on next`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null)))
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
            viewModel.onIntent(ReviewIntent.NextTapped)
            val next: ReviewUiState.Reviewing = awaitReviewing()
            assertEquals(1, next.dueCount)
            assertEquals(schoolRecognition.wordId, next.card.wordId)
        }
        assertEquals(2, learning.readCount)
    }

    @Test
    fun `reads the reviews again on next when the re-read after the answer failed`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null)))
        learning.answerRead(ReviewsReadResult.Unreachable)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
            viewModel.onIntent(ReviewIntent.NextTapped)
            assertEquals(schoolRecognition.wordId, awaitReviewing().card.wordId)
        }
        assertEquals(3, learning.readCount)
    }

    @Test
    fun `asks the hint of the recall card on screen`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Hinting }
        }
        assertEquals(listOf(homeRecall.wordId), learning.hints)
    }

    @Test
    fun `keeps the hint after a near-miss`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerHint(ReviewHintResult.Hinted(ReviewHint(firstLetter = "h", letterCount = 4)))
        learning.answerReview(ReviewAnswerResult.Answered(ReviewVerdict.NearMiss))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Answering }
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            val nearMiss: ReviewUiState.Reviewing = awaitStep { it == ReviewUiState.ReviewStep.NearMiss }
            assertEquals(
                ReviewHint(firstLetter = "h", letterCount = 4),
                (nearMiss.card as ReviewUiState.ReviewCard.Recall).hint,
            )
        }
    }

    @Test
    fun `keeps the refusal the api names beside the card`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Refused(ReviewRefusal.ReviewNotDue))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Refused(ReviewRefusal.ReviewNotDue),
                awaitStep { it is ReviewUiState.ReviewStep.Refused }.step,
            )
        }
    }

    @Test
    fun `tells the player the answer could not reach the api`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Unreachable)

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Unreachable }
        }
    }

    @Test
    fun `reads the review again on retry after a refusal`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Refused(ReviewRefusal.WordNotHeld))
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Refused }
            viewModel.onIntent(ReviewIntent.RetryTapped)
            assertEquals(schoolRecognition.wordId, awaitReviewing().card.wordId)
        }
        assertEquals(2, learning.readCount)
    }

    private fun correctHome(earnedSkill: RaisedSkill?): ReviewVerdict =
        ReviewVerdict.Correct(
            word = "home",
            gloss = "casa",
            dueAt = firstReadAt + 10.minutes,
            earnedSkill = earnedSkill,
        )

    @Test
    fun `counts a rated card walked when the same card heads the due list again`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        val wrongHome: ReviewVerdict = ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = firstReadAt)
        learning.answerReview(ReviewAnswerResult.Answered(wrongHome))
        learning.answerRead(dueNow(homeRecall))

        viewModel.state.test {
            assertEquals(0, awaitReviewing().walked)
            viewModel.onIntent(ReviewIntent.AnswerChanged("house"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Wrong }
            viewModel.onIntent(ReviewIntent.NextTapped)
            val next: ReviewUiState.Reviewing = awaitReviewing()
            assertEquals(homeRecall.wordId, next.card.wordId)
            assertEquals(1, next.walked)
        }
    }

    @Test
    fun `keeps the walked count through a read after next`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall, schoolRecognition))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null)))
        learning.answerRead(ReviewsReadResult.Unreachable)
        learning.answerRead(dueNow(schoolRecognition))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("home"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
            viewModel.onIntent(ReviewIntent.NextTapped)
            assertEquals(1, awaitReviewing().walked)
        }
    }

    @Test
    fun `walks nothing on a near miss`() = runTest {
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(learning)
        learning.answerRead(dueNow(homeRecall))
        learning.answerReview(ReviewAnswerResult.Answered(ReviewVerdict.NearMiss))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("hme"))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(0, awaitStep { it == ReviewUiState.ReviewStep.NearMiss }.walked)
        }
    }
}
