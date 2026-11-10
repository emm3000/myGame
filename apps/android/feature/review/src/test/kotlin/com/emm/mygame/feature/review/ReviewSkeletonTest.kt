package com.emm.mygame.feature.review

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReviewSkeletonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var state: ReviewUiState by mutableStateOf(ReviewUiState.Loading)

    @Test
    fun `shows the review skeleton when the read is slow`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(4)
    }

    @Test
    fun `draws no skeleton when the reviews answer inside the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)

        answer()
        val drawnAtTheAnswer: Int = drawnBlocks()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        assertEquals(listOf(0, 0), listOf(drawnAtTheAnswer, drawnBlocks()))
        composeRule.onNodeWithText(CONTENT).assertExists()
    }

    @Test
    fun `keeps the skeleton for the minimum hold when the reviews answer just after it appears`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        answer()
        composeRule.mainClock.advanceTimeBy(insideHold)

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(4)
        composeRule.onAllNodesWithText(CONTENT).assertCountEquals(0)
    }

    @Test
    fun `never draws the reading line`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onAllNodesWithText(READING_LINE).assertCountEquals(0)
    }

    @Test
    fun `speaks the reading line in a polite live region`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onNodeWithContentDescription(READING_LINE)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    private fun drawLoading() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = state, onIntent = { }, onLessonOpen = { }, onTownOpen = { })
            }
        }
    }

    private fun answer() {
        state = ReviewUiState.NoCards
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun drawnBlocks(): Int =
        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).fetchSemanticsNodes().size

    private companion object {
        const val READING_LINE: String = "Estamos leyendo tu repaso…"
        const val CONTENT: String = "Aún no tienes palabras que repasar."
        const val FRAME_MARGIN: Long = 50
        val beforeReveal: Long = MyGameTransitions.REVEAL_MILLIS - FRAME_MARGIN
        val pastReveal: Long = MyGameTransitions.REVEAL_MILLIS + FRAME_MARGIN
        val insideHold: Long = MyGameTransitions.HOLD_MILLIS - 2 * FRAME_MARGIN
    }
}
