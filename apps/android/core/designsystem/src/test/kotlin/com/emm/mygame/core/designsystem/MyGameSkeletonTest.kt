package com.emm.mygame.core.designsystem

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameSkeletonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var isLoading: Boolean by mutableStateOf(true)

    @Test
    fun `draws no skeleton before the reveal delay`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(beforeReveal)

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws a block per screen block once the read is slower than the reveal delay`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(screenBlockCount)
    }

    @Test
    fun `draws no skeleton when the read answers inside the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)

        answer()
        val drawnAtTheAnswer: Int = drawnBlocks()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        assertEquals(listOf(0, 0), listOf(drawnAtTheAnswer, drawnBlocks()))
        composeRule.onNodeWithText(CONTENT).assertExists()
    }

    @Test
    fun `keeps the skeleton for the minimum hold when the read answers just after it appears`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        answer()
        composeRule.mainClock.advanceTimeBy(insideHold)

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(screenBlockCount)
        composeRule.onAllNodesWithText(CONTENT).assertCountEquals(0)
    }

    @Test
    fun `draws the content once the minimum hold has passed`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        answer()
        composeRule.mainClock.advanceTimeBy(pastHold)

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(0)
        composeRule.onNodeWithText(CONTENT).assertExists()
    }

    @Test
    fun `speaks the loading line in a polite live region`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        val spoken: LiveRegionMode = composeRule.onNodeWithContentDescription(LOADING_LINE)
            .fetchSemanticsNode()
            .config[SemanticsProperties.LiveRegion]
        assertEquals(LiveRegionMode.Polite, spoken)
    }

    @Test
    fun `never draws the loading line as text`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onAllNodesWithText(LOADING_LINE).assertCountEquals(0)
    }

    @Test
    fun `pulses the blocks in calm`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)
        val first: Float = pulse()

        composeRule.mainClock.advanceTimeBy(MyGameTransitions.CALM_MILLIS.toLong() / 2)

        assertNotEquals(first, pulse())
    }

    @Test
    fun `never fades the blocks into the background`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        val pulses: List<Float> = (1..PULSE_SAMPLES).map {
            composeRule.mainClock.advanceTimeBy(MyGameTransitions.CALM_MILLIS.toLong() * 2 / PULSE_SAMPLES)
            pulse()
        }

        assertTrue(pulses.max() < BACKGROUND)
    }

    private fun drawLoading() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                MyGameSkeleton(isLoading = isLoading, loadingLabel = LOADING_LINE, blocks = screenBlocks) {
                    MyGameText(text = CONTENT, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
                }
            }
        }
    }

    private fun answer() {
        isLoading = false
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun drawnBlocks(): Int =
        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).fetchSemanticsNodes().size

    private fun pulse(): Float =
        composeRule.onNode(SemanticsMatcher.keyIsDefined(SKELETON_PULSE), useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SKELETON_PULSE]

    private companion object {
        const val LOADING_LINE: String = "Reading your town…"
        const val CONTENT: String = "Maple"
        const val FRAME_MARGIN: Long = 50
        const val PULSE_SAMPLES: Int = 40
        const val BACKGROUND: Float = 1f
        val screenBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
            listOf(MyGameSizes.control, MyGameSizes.placeCard, MyGameSizes.thumbnail),
        )
        val screenBlockCount: Int = screenBlocks.heights.size
        val beforeReveal: Long = MyGameTransitions.REVEAL_MILLIS - FRAME_MARGIN
        val pastReveal: Long = MyGameTransitions.REVEAL_MILLIS + FRAME_MARGIN
        val insideHold: Long = MyGameTransitions.HOLD_MILLIS - 2 * FRAME_MARGIN
        val pastHold: Long = MyGameTransitions.HOLD_MILLIS + FRAME_MARGIN
    }
}
