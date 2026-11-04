package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.EarnedSkill
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewHintResult
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.testing.FakeFiefRepository
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

    private val foodSkill: EarnedSkill =
        EarnedSkill(lesson = LessonId("lesson-1"), resource = ResourceKind.Food, ratePercent = 5)

    @Test
    fun `draws loading until the read answers`() = runTest {
        val viewModel: ReviewViewModel = openReview(FakeFiefRepository())

        viewModel.state.test {
            assertEquals(ReviewUiState.Loading, awaitItem())
        }
    }

    @Test
    fun `draws the failed read`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: ReviewViewModel = openReview(fiefs)
        fiefs.answerRead(FiefReadResult.Unreachable)

        viewModel.state.test {
            assertEquals(ReviewUiState.Failed, expectMostRecentItem())
        }
    }

    @Test
    fun `reads again on retry after a failed read`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: ReviewViewModel = openReview(fiefs)
        fiefs.answerRead(FiefReadResult.Unreachable)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(schoolRecognition)))

        viewModel.state.test {
            assertEquals(ReviewUiState.Failed, expectMostRecentItem())
            viewModel.onIntent(ReviewIntent.RetryTapped)
            awaitReviewing()
        }
        assertEquals(listOf(FiefId(FIEF_ID), FiefId(FIEF_ID)), fiefs.reads)
    }

    @Test
    fun `draws no card before lesson 1 enters its words`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: ReviewViewModel = openReview(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fiefDue()))

        viewModel.state.test {
            assertEquals(ReviewUiState.NoCards, expectMostRecentItem())
        }
    }

    @Test
    fun `draws nothing due with the next due instant projected with the read's gap`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val skewedDevice: Instant = firstReadAt - 30.seconds
        val viewModel: ReviewViewModel = openReview(fiefs, deviceNow = skewedDevice)
        val nextDueAt: Instant = firstReadAt + 9.minutes
        fiefs.answerRead(FiefReadResult.Read(fief(reviews = DueReviews(due = emptyList(), nextDueAt = nextDueAt))))

        viewModel.state.test {
            assertEquals(
                ReviewUiState.NothingDue(remaining = 9.minutes, dueAt = skewedDevice + 9.minutes),
                expectMostRecentItem(),
            )
        }
    }

    @Test
    fun `reads again when the next review falls due`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: ReviewViewModel = openReview(fiefs)
        val nextDueAt: Instant = firstReadAt + 2.seconds
        fiefs.answerRead(FiefReadResult.Read(fief(reviews = DueReviews(due = emptyList(), nextDueAt = nextDueAt))))
        fiefs.answerRead(FiefReadResult.Read(fiefDue(schoolRecognition)))

        viewModel.state.test {
            advanceTimeBy(2.seconds)
            runCurrent()
            awaitReviewing()
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `draws only the cards the api answers as due`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: ReviewViewModel = openReview(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall, schoolRecognition)))

        viewModel.state.test {
            assertEquals(
                ReviewUiState.Reviewing(
                    dueCount = 2,
                    card = ReviewUiState.ReviewCard.Recall(
                        wordId = homeRecall.wordId,
                        gloss = "casa",
                        gappedFrame = "She goes ___ at six.",
                        typed = "",
                        hint = null,
                    ),
                    step = ReviewUiState.ReviewStep.Answering,
                ),
                awaitReviewing(),
            )
        }
    }

    @Test
    fun `draws a recognition card with its word, its frame and its choices`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: ReviewViewModel = openReview(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(schoolRecognition)))

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
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(schoolRecognition)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.ChoiceChosen(ChoiceId("4e5f6a7b")))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Checking }
        }
        assertEquals(
            listOf(FakeLearningRepository.AnswerRequest(FiefId(FIEF_ID), schoolRecognition.wordId, "4e5f6a7b")),
            learning.answers,
        )
    }

    @Test
    fun `sends nothing for a recognition with no choice`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(schoolRecognition)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            expectNoEvents()
        }
        assertEquals(emptyList<FakeLearningRepository.AnswerRequest>(), learning.answers)
    }

    @Test
    fun `sends the typed answer of a recall exactly as typed`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.AnswerChanged("  Home "))
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Checking }
        }
        assertEquals("  Home ", learning.answers.single().answer)
    }

    @Test
    fun `sends one answer while the first one waits`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            viewModel.onIntent(ReviewIntent.CheckTapped)
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Checking }
        }
        assertEquals(1, learning.answers.size)
        assertEquals(emptyList<FakeLearningRepository.HintRequest>(), learning.hints)
    }

    @Test
    fun `keeps the typed answer after a near-miss`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerReview(ReviewAnswerResult.Answered(ReviewVerdict.NearMiss, fiefDue(homeRecall)))

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
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        val wrong: ReviewVerdict = ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = firstReadAt + 1.minutes)
        learning.answerReview(ReviewAnswerResult.Answered(wrong, fiefDue()))

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
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(schoolRecognition)))
        val wrong: ReviewVerdict =
            ReviewVerdict.Wrong(word = "school", gloss = "escuela", dueAt = firstReadAt + 1.minutes)
        learning.answerReview(ReviewAnswerResult.Answered(wrong, fiefDue()))

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
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null), fiefDue()))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Correct(skill = null),
                awaitStep { it is ReviewUiState.ReviewStep.Correct }.step,
            )
        }
    }

    @Test
    fun `draws the skill earned at its level among the answered fief's skills`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerReview(
            ReviewAnswerResult.Answered(correctHome(earnedSkill = foodSkill), fiefDue(skills = listOf(foodSkill))),
        )

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Correct(
                    skill = ReviewUiState.SkillLine(resource = ResourceKind.Food, level = 1, ratePercent = 5),
                ),
                awaitStep { it is ReviewUiState.ReviewStep.Correct }.step,
            )
        }
    }

    @Test
    fun `draws the due list of the answered fief on next`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall, schoolRecognition)))
        learning.answerReview(ReviewAnswerResult.Answered(correctHome(earnedSkill = null), fiefDue(schoolRecognition)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Correct }
            viewModel.onIntent(ReviewIntent.NextTapped)
            val next: ReviewUiState.Reviewing = awaitReviewing()
            assertEquals(1, next.dueCount)
            assertEquals(schoolRecognition.wordId, next.card.wordId)
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `asks the hint of the recall card on screen`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Hinting }
        }
        assertEquals(listOf(FakeLearningRepository.HintRequest(FiefId(FIEF_ID), homeRecall.wordId)), learning.hints)
    }

    @Test
    fun `keeps the hint after a near-miss`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerHint(ReviewHintResult.Hinted(ReviewHint(firstLetter = "h", letterCount = 4)))
        learning.answerReview(ReviewAnswerResult.Answered(ReviewVerdict.NearMiss, fiefDue(homeRecall)))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.HintTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Answering }
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
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerReview(ReviewAnswerResult.Refused(ReviewRefusal.ReviewNotDue))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            assertEquals(
                ReviewUiState.ReviewStep.Refused(ReviewRefusal.ReviewNotDue),
                awaitStep { it is ReviewUiState.ReviewStep.Refused }.step,
            )
        }
    }

    @Test
    fun `tells the player the answer could not reach the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerReview(ReviewAnswerResult.Unreachable)

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it == ReviewUiState.ReviewStep.Unreachable }
        }
    }

    @Test
    fun `reads the review again on retry after a refusal`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: ReviewViewModel = openReview(fiefs, learning)
        fiefs.answerRead(FiefReadResult.Read(fiefDue(homeRecall)))
        learning.answerReview(ReviewAnswerResult.Refused(ReviewRefusal.WordNotHeld))
        val reread: FiefSnapshot = fiefDue(schoolRecognition)
        fiefs.answerRead(FiefReadResult.Read(reread))

        viewModel.state.test {
            awaitReviewing()
            viewModel.onIntent(ReviewIntent.CheckTapped)
            awaitStep { it is ReviewUiState.ReviewStep.Refused }
            viewModel.onIntent(ReviewIntent.RetryTapped)
            assertEquals(schoolRecognition.wordId, awaitReviewing().card.wordId)
        }
        assertEquals(2, fiefs.readCount)
    }

    private fun correctHome(earnedSkill: EarnedSkill?): ReviewVerdict =
        ReviewVerdict.Correct(
            word = "home",
            gloss = "casa",
            dueAt = firstReadAt + 10.minutes,
            earnedSkill = earnedSkill,
        )
}
