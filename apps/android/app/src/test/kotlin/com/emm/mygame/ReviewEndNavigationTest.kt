package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.wordReadingOf
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReviewEndNavigationTest : SignedInScreenFixture() {

    private val unreadFirst: NextStep = NextStep.Reviews(count = 0, readFirst = listOf(firstLesson))

    private val readingTown: TownSnapshot = townOf(
        readAt,
        nextStep = unreadFirst,
        lessons = listOf(
            lessonOf(firstLesson).copy(readings = listOf(wordReadingOf("water", "agua", WATER_FRAME))),
        ),
    )

    private fun wayOn(label: String): SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true).or(hasText(label)))

    @Test
    fun `reviews entered from a lesson's words return to Today at their end, with the words popped`() {
        learning.answerRead(ReviewsReadResult.Read(noCards.copy(readFirst = listOf(firstLesson))))
        showing(Destination.Today, Destination.LessonWords(firstLesson, walked = emptyList()), town = readingTown)
        waitFor(wayOn(START_REVIEWS))
        learning.answerRead(ReviewsReadResult.Read(noCards))

        composeRule.onNode(wayOn(START_REVIEWS)).performScrollTo().performClick()
        waitFor(wayOn(CONTINUE))
        composeRule.onNode(wayOn(CONTINUE)).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() == Destination.Today }
        assertEquals(listOf(Destination.Today), shownStack?.toList())
    }

    private companion object {
        const val WATER_FRAME: String = "I drink water."
        const val START_REVIEWS: String = "Empezar los repasos"
        const val CONTINUE: String = "Continuar"
    }
}
