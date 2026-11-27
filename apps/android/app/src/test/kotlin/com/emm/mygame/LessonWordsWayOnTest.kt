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
import com.emm.mygame.core.designsystem.control.INK_PILL
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.testing.lessonsDone
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.wordReadingOf
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w360dp-h640dp", fontScale = 2f)
class LessonWordsWayOnTest : SignedInScreenFixture() {

    private val homeWord: TownSnapshot.WordReading =
        wordReadingOf(word = "home", gloss = "hogar", frame = "This is my home.")

    private val waterWord: TownSnapshot.WordReading =
        wordReadingOf(word = "water", gloss = "agua", frame = "I drink water.")

    private val inScroll: SemanticsMatcher = hasAnyAncestor(hasScrollAction())

    private fun wayOn(label: String): SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true).or(hasText(label)))

    private fun townReading(
        readings: List<TownSnapshot.WordReading>,
        nextStep: NextStep = lessonsDone,
        lessonSlot: TownSnapshot.LessonSlot? = null,
    ): TownSnapshot = townOf(
        readAt,
        nextStep = nextStep,
        lessons = listOf(lessonOf(firstLesson).copy(readings = readings)),
        lessonSlot = lessonSlot,
    )

    @Test
    fun `a lesson's words draw their way on at the foot of the content, and no dock is drawn`() {
        repeat(READS) { learning.answerRead(ReviewsReadResult.Read(noCards.copy(readFirst = listOf(firstLesson)))) }
        showing(
            Destination.Today,
            Destination.LessonWords(firstLesson, walked = emptyList()),
            town = townReading(listOf(homeWord, waterWord)),
        )
        waitFor(hasText(HOME_FRAME))

        composeRule.onNode(wayOn(NEXT_WORD)).assert(inScroll).performScrollTo().performClick()
        waitFor(hasText(WATER_FRAME))

        composeRule.onNode(wayOn(START_REVIEWS)).assert(inScroll).performScrollTo().assertIsDisplayed()
        composeRule.onAllNodes(hasTestTag(INK_PILL).and(inScroll.not())).assertCountEquals(0)
    }

    @Test
    fun `when the last word is walked, the way on returns to the screen that opened the lesson`() {
        repeat(READS) { learning.answerRead(ReviewsReadResult.Read(noCards)) }
        showing(
            Destination.Today,
            Destination.LessonWords(firstLesson, walked = emptyList()),
            town = townReading(
                readings = listOf(waterWord),
                lessonSlot = TownSnapshot.LessonSlot(firstLesson, readAt, readAt + 10.minutes),
            ),
        )
        waitFor(hasText(WATER_FRAME))

        composeRule.onNode(wayOn(CONTINUE)).assert(inScroll).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() == Destination.Today }
        assertEquals(listOf(Destination.Today), shownStack?.toList())
    }

    @Test
    fun `the spent page's way on returns to the screen that opened the lesson's words`() {
        repeat(READS) { learning.answerRead(ReviewsReadResult.Read(noCards)) }
        showing(
            Destination.Today,
            Destination.LessonWords(firstLesson, walked = emptyList()),
            town = townReading(readings = emptyList()),
        )
        waitFor(hasText(NOTHING_TO_READ))

        composeRule.onNode(wayOn(CONTINUE)).assert(inScroll).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() == Destination.Today }
        assertEquals(listOf(Destination.Today), shownStack?.toList())
    }

    @Test
    fun `the spent page names the town's next step right above its way on`() {
        repeat(READS) { learning.answerRead(ReviewsReadResult.Read(noCards)) }
        showing(
            Destination.Today,
            Destination.LessonWords(firstLesson, walked = emptyList()),
            town = townReading(readings = emptyList(), nextStep = NextStep.LessonToStudy(firstLesson)),
        )
        waitFor(hasText(NOTHING_TO_READ))

        assertNamedAboveContinue(STUDY_LESSON_ONE)
    }

    @Test
    fun `the last word's way back names the town's next step right above it`() {
        repeat(READS) { learning.answerRead(ReviewsReadResult.Read(noCards)) }
        showing(
            Destination.Today,
            Destination.LessonWords(firstLesson, walked = emptyList()),
            town = townReading(
                readings = listOf(waterWord),
                nextStep = NextStep.Reviews(count = 2, readFirst = emptyList()),
                lessonSlot = TownSnapshot.LessonSlot(firstLesson, readAt, readAt + 10.minutes),
            ),
        )
        waitFor(hasText(WATER_FRAME))

        assertNamedAboveContinue(START_REVIEWS)
    }

    private fun assertNamedAboveContinue(step: String) {
        val named: SemanticsMatcher = hasText(step).and(inScroll).and(hasTestTag(INK_PILL).not())
        composeRule.onNode(hasText(NEXT_STEP_TITLE, ignoreCase = true).and(inScroll)).assertExists()
        composeRule.onNode(named).assertExists()
        val stepBottom: Dp = composeRule.onNode(named).getUnclippedBoundsInRoot().bottom
        assertTrue(stepBottom <= composeRule.onNode(wayOn(CONTINUE)).getUnclippedBoundsInRoot().top)
    }

    private companion object {
        const val READS: Int = 3
        const val NEXT_STEP_TITLE: String = "Tu siguiente paso"
        const val STUDY_LESSON_ONE: String = "Estudiar la lección 1"
        const val HOME_FRAME: String = "This is my home."
        const val WATER_FRAME: String = "I drink water."
        const val NEXT_WORD: String = "Siguiente palabra"
        const val START_REVIEWS: String = "Empezar los repasos"
        const val CONTINUE: String = "Continuar"
        const val NOTHING_TO_READ: String = "Ahora no hay palabras para leer."
    }
}
