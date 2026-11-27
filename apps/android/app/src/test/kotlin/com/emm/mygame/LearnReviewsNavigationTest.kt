package com.emm.mygame

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.town.guidance.NextStep
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LearnReviewsNavigationTest : SignedInScreenFixture() {

    @Test
    fun `Learn's Start the reviews opens the reviews above Learn`() {
        learning.answerRead(ReviewsReadResult.Read(noCards))
        showing(
            Destination.Today,
            Destination.School,
            town = playedTown(NextStep.Reviews(count = 3, readFirst = emptyList())),
        )
        waitFor(hasText(START_REVIEWS))

        composeRule.onNode(hasText(START_REVIEWS)).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() == Destination.Review }
        assertEquals(listOf(Destination.Today, Destination.School, Destination.Review), shownStack?.toList())
    }

    private companion object {
        const val START_REVIEWS: String = "Empezar los repasos"
    }
}
