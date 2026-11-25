package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.model.learning.DueReview
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.ReviewAnswerResult
import com.emm.mygame.core.model.learning.ReviewChoice
import com.emm.mygame.core.model.learning.ReviewVerdict
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.town.guidance.NextStep
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w360dp-h640dp", fontScale = 2f)
class ReviewsWayOnTest : DockFrameFixture() {

    private val schoolRecognition: DueReview.Recognition = DueReview.Recognition(
        wordId = WordId("lesson-1-2"),
        lesson = firstLesson,
        dueAt = readAt,
        word = "school",
        frame = listOf(FrameSpan(text = "The kids walk to school.", support = null)),
        choices = listOf(
            ReviewChoice(id = ChoiceId("0a1b2c3d"), gloss = "dinero"),
            ReviewChoice(id = ChoiceId("4e5f6a7b"), gloss = "escuela"),
        ),
    )

    private val correct: ReviewAnswerResult = ReviewAnswerResult.Answered(
        ReviewVerdict.Correct(
            word = "school",
            gloss = "escuela",
            dueAt = readAt,
            earnedSkill = null,
            openedLevel = null,
        ),
    )

    private val inScroll: SemanticsMatcher = hasAnyAncestor(hasScrollAction())

    private val verdict: SemanticsMatcher = hasText(CORRECT)

    private fun wayOn(label: String): SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true).or(hasText(label)))

    @Test
    fun `a review's verdict and its way on are drawn in the task's flow, and no dock is drawn`() {
        learning.answerRead(ReviewsReadResult.Read(DueReviews(listOf(schoolRecognition), emptyList(), null, readAt)))
        learning.answerReview(correct)
        learning.answerRead(ReviewsReadResult.Read(noCards))
        showing(Destination.Today, Destination.Review)
        waitFor(hasText(SCHOOL_GLOSS))

        composeRule.onNode(hasText(SCHOOL_GLOSS)).performScrollTo().performClick()
        composeRule.onNode(wayOn(CHECK)).assert(inScroll).performScrollTo().performClick()
        waitFor(verdict)

        composeRule.onNode(verdict).assert(inScroll)
        composeRule.onNode(wayOn(NEXT)).assert(inScroll).performScrollTo().assertIsDisplayed()
        val verdictBottom: Dp = composeRule.onNode(verdict).getUnclippedBoundsInRoot().bottom
        assertTrue(verdictBottom <= composeRule.onNode(wayOn(NEXT)).getUnclippedBoundsInRoot().top)
        composeRule.onAllNodes(hasTestTag(INK_PILL).and(inScroll.not())).assertCountEquals(0)
    }

    @Test
    fun `ended reviews' way on returns to the screen that opened them, where the first card names the next step`() {
        learning.answerRead(ReviewsReadResult.Read(noCards))
        showing(
            Destination.Today,
            Destination.Review,
            town = playedTown(NextStep.Reviews(count = 0, readFirst = listOf(firstLesson))),
        )
        waitFor(hasText(NO_CARDS))

        composeRule.onNode(wayOn(CONTINUE)).assert(inScroll).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() == Destination.Today }
        assertEquals(listOf(Destination.Today), shownStack?.toList())
        waitFor(wayOn(READ_THE_WORDS))
        composeRule.onNode(wayOn(READ_THE_WORDS)).performScrollTo().assertIsDisplayed()
    }

    private companion object {
        const val SCHOOL_GLOSS: String = "escuela"
        const val CHECK: String = "Comprobar"
        const val NEXT: String = "Siguiente"
        const val CORRECT: String = "Correcto."
        const val NO_CARDS: String = "Aún no tienes palabras que repasar."
        const val CONTINUE: String = "Continuar"
        const val READ_THE_WORDS: String = "Leer las palabras"
    }
}
