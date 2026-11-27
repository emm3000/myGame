package com.emm.mygame.core.designsystem

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.control.WORKING_DOTS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_ALPHAS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_TINT
import com.emm.mygame.core.designsystem.frame.MyGameSkeleton
import com.emm.mygame.core.designsystem.frame.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.frame.SKELETON_BLOCK
import com.emm.mygame.core.designsystem.frame.SKELETON_PULSE
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTransitions
import com.emm.mygame.core.designsystem.theme.MyGameTypography
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

    private var inkMuted: Color = Color.Unspecified

    @Test
    fun `draws the working dots on the first frame of a load`() {
        drawContent()
        val dotsBefore: Int = drawnDots()

        load()

        assertEquals(listOf(0, 1), listOf(dotsBefore, drawnDots()))
    }

    @Test
    fun `draws the loading dots at the top of the content`() {
        drawLoading()
        composeRule.mainClock.advanceTimeByFrame()
        val topAtTheFirstFrame: Float? = dotsBounds()?.top
        composeRule.mainClock.advanceTimeBy(pastReveal)

        val blocksTop: Float = blockBounds().minOf { block: Rect -> block.top }
        assertEquals(listOf(screenTop(), screenTop()), listOf(topAtTheFirstFrame, dotsBounds()?.top))
        assertTrue("the dots end above the blocks", (dotsBounds()?.bottom ?: Float.MAX_VALUE) <= blocksTop)
    }

    @Test
    fun `tints the loading dots in ink-muted`() {
        drawLoading()

        composeRule.mainClock.advanceTimeByFrame()

        assertEquals(inkMuted, dotsNode()?.config?.getOrNull(WORKING_DOT_TINT))
    }

    @Test
    fun `pulses the loading dots before the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeByFrame()
        val first: List<Float>? = dotAlphas()

        composeRule.mainClock.advanceTimeBy(MyGameTransitions.CALM_MILLIS.toLong())

        assertTrue("the dots are drawn", first != null)
        assertNotEquals(first, dotAlphas())
    }

    @Test
    fun `speaks the loading line in a polite live region from the first frame of a load`() {
        drawContent()
        val spokenBefore: LiveRegionMode? = spokenLiveRegion()

        load()

        assertEquals(listOf(null, LiveRegionMode.Polite), listOf(spokenBefore, spokenLiveRegion()))
    }

    @Test
    fun `draws a block per screen block once the read is slower than the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)
        val drawnBeforeTheReveal: Int = drawnBlocks()

        composeRule.mainClock.advanceTimeBy(pastReveal - beforeReveal)

        assertEquals(listOf(0, screenBlockCount), listOf(drawnBeforeTheReveal, drawnBlocks()))
    }

    @Test
    fun `draws the loading line beside the dots once the read is slower than the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)
        val drawnBeforeTheReveal: Int = drawnLines()

        composeRule.mainClock.advanceTimeBy(pastReveal - beforeReveal)

        assertEquals(listOf(0, 1), listOf(drawnBeforeTheReveal, drawnLines()))
        val dots: Rect? = dotsBounds()
        val line: Rect = composeRule.onNodeWithText(LOADING_LINE, useUnmergedTree = true)
            .fetchSemanticsNode()
            .boundsInRoot
        assertTrue("the line starts after the dots", dots != null && line.left >= dots.right)
        assertTrue("the line shares the dots' row", dots != null && line.top < dots.bottom && dots.top < line.bottom)
    }

    @Test
    fun `speaks the drawn loading line once`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        val spoken: List<SemanticsNode> = composeRule.onAllNodes(
            (hasContentDescription(LOADING_LINE) or hasText(LOADING_LINE)) and
                SemanticsMatcher.keyNotDefined(SemanticsProperties.HideFromAccessibility),
            useUnmergedTree = true,
        ).fetchSemanticsNodes()
        assertEquals(1, spoken.size)
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

        assertEquals(listOf(0, 0), listOf(drawnBlocks(), drawnDots()))
        composeRule.onNodeWithText(CONTENT).assertExists()
    }

    @Test
    fun `shows the dots and no blocks when the read answers inside the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)
        val drawnWhileReading: List<Int> = listOf(drawnDots(), drawnBlocks())

        answer()
        val drawnAtTheAnswer: List<Int> = listOf(drawnDots(), drawnBlocks())
        composeRule.mainClock.advanceTimeBy(pastReveal)

        assertEquals(
            listOf(listOf(1, 0), listOf(0, 0), listOf(0, 0)),
            listOf(drawnWhileReading, drawnAtTheAnswer, listOf(drawnDots(), drawnBlocks())),
        )
        composeRule.onNodeWithText(CONTENT).assertExists()
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

    private fun drawContent() {
        isLoading = false
        drawLoading()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun drawLoading() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                inkMuted = MyGameTheme.colors.inkMuted
                MyGameSkeleton(
                    isLoading = isLoading,
                    loadingLabel = LOADING_LINE,
                    blocks = screenBlocks,
                    modifier = Modifier.testTag(SCREEN),
                ) {
                    MyGameText(text = CONTENT, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
                }
            }
        }
    }

    private fun load() {
        isLoading = true
        composeRule.waitForIdle()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun answer() {
        isLoading = false
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun drawnBlocks(): Int =
        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).fetchSemanticsNodes().size

    private fun drawnDots(): Int =
        composeRule.onAllNodesWithTag(WORKING_DOTS, useUnmergedTree = true).fetchSemanticsNodes().size

    private fun drawnLines(): Int =
        composeRule.onAllNodesWithText(LOADING_LINE, useUnmergedTree = true).fetchSemanticsNodes().size

    private fun dotsNode(): SemanticsNode? =
        composeRule.onAllNodesWithTag(WORKING_DOTS, useUnmergedTree = true).fetchSemanticsNodes().firstOrNull()

    private fun dotsBounds(): Rect? = dotsNode()?.boundsInRoot

    private fun dotAlphas(): List<Float>? = dotsNode()?.config?.getOrNull(WORKING_DOT_ALPHAS)

    private fun blockBounds(): List<Rect> =
        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .map { block: SemanticsNode -> block.boundsInRoot }

    private fun screenTop(): Float? =
        composeRule.onAllNodesWithTag(SCREEN, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .firstOrNull()
            ?.boundsInRoot
            ?.top

    private fun spokenLiveRegion(): LiveRegionMode? =
        composeRule.onAllNodes(hasContentDescription(LOADING_LINE), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .firstOrNull()
            ?.config
            ?.getOrNull(SemanticsProperties.LiveRegion)

    private fun pulse(): Float =
        composeRule.onNode(SemanticsMatcher.keyIsDefined(SKELETON_PULSE), useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SKELETON_PULSE]

    private companion object {
        const val LOADING_LINE: String = "Reading your town…"
        const val CONTENT: String = "Maple"
        const val SCREEN: String = "SCREEN"
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
