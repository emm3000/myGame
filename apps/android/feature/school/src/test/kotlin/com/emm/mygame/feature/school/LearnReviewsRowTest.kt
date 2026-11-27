package com.emm.mygame.feature.school

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.control.GO_OUTLINED_PILL
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class LearnReviewsRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private var reviewsOpenCount: Int = 0

    private fun show(town: TownSnapshot, now: Instant = readInstant) {
        val content: SchoolUiState.Content =
            town.contentAt(now = now, gap = Duration.ZERO, requests = SchoolRequests.none, selected = null)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = content,
                    onIntent = {},
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onTextOpen = {},
                    onReviewsOpen = { reviewsOpenCount += 1 },
                )
            }
        }
    }

    private fun goButton(label: String): SemanticsMatcher = hasTestTag(GO_OUTLINED_PILL).and(hasText(label))

    private val reviewsDue: TownSnapshot = townOf(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList()))

    @Test
    fun `while reviews are due Learn's row reads their count`() {
        show(reviewsDue)

        composeRule.onNode(hasText(REVIEWS_DUE)).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `while reviews are due Learn's outlined go button opens the reviews`() {
        show(reviewsDue)

        composeRule.onNode(goButton(START_REVIEWS)).performScrollTo().performClick()

        assertEquals(1, reviewsOpenCount)
    }

    @Test
    fun `while unread words come first Learn's outlined go button reads Read the words and opens that lesson`() {
        show(townOf(nextStep = NextStep.Reviews(count = 3, readFirst = listOf(firstLesson))))

        composeRule.onNode(goButton(READ_THE_WORDS)).performScrollTo().performClick()

        assertEquals(listOf(firstLesson), lessonOpens)
    }

    @Test
    fun `with no reviews due Learn's row reads No reviews due now`() {
        show(townOf(nextDueAt = null))

        composeRule.onNode(hasText(NO_REVIEWS_DUE)).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `with no reviews due Learn's row reads the next review's time while it is later than now`() {
        show(townOf(nextDueAt = readInstant + 30.minutes))

        composeRule.onNode(hasText(NEXT_REVIEW_IN_HALF_AN_HOUR)).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `with no reviews due Learn's row reads no next review time once it is not later than now`() {
        show(townOf(nextDueAt = readInstant), now = readInstant)

        composeRule.onNode(hasText(NO_REVIEWS_DUE)).performScrollTo().assertIsDisplayed()
        composeRule.onAllNodes(hasText(NEXT_REVIEW, substring = true)).assertCountEquals(0)
    }

    @Test
    fun `while a holdout check leads and a review is due Learn draws no reviews row`() {
        val holdoutLeads: NextStep = NextStep.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        show(townOf(nextStep = holdoutLeads, nextDueAt = readInstant), now = readInstant)

        composeRule.onNodeWithText(LEARN_TITLE).assertIsDisplayed()
        composeRule.onAllNodes(hasText(NO_REVIEWS_DUE)).assertCountEquals(0)
        composeRule.onAllNodes(hasText(REVIEWS_DUE_PREFIX, substring = true)).assertCountEquals(0)
    }

    private companion object {
        const val LEARN_TITLE: String = "Aprender"
        const val REVIEWS_DUE_PREFIX: String = "Repasos pendientes"
        const val NO_REVIEWS_DUE: String = "No tienes repasos pendientes ahora."
        const val NEXT_REVIEW: String = "Siguiente repaso:"
        const val NEXT_REVIEW_IN_HALF_AN_HOUR: String = "Siguiente repaso: 30 min"
        const val READ_THE_WORDS: String = "Leer las palabras"
        const val REVIEWS_DUE: String = "Repasos pendientes: 3"
        const val START_REVIEWS: String = "Empezar los repasos"
    }
}
