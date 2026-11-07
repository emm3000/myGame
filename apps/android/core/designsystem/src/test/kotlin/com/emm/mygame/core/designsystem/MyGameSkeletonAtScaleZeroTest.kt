package com.emm.mygame.core.designsystem

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameSkeletonAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `draws a still skeleton at animator scale 0`() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                MyGameSkeleton(isLoading = true, loadingLabel = "Reading your town…", blocks = screenBlocks) {}
            }
        }
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + FRAME_MARGIN)
        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(screenBlockCount)

        val pulses: List<Float> = (1..PULSE_SAMPLES).map {
            composeRule.mainClock.advanceTimeBy(MyGameTransitions.CALM_MILLIS.toLong() / PULSE_SAMPLES)
            pulse()
        }

        assertEquals(List(PULSE_SAMPLES) { 0f }, pulses)
    }

    private fun pulse(): Float =
        composeRule.onNode(SemanticsMatcher.keyIsDefined(SKELETON_PULSE), useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SKELETON_PULSE]

    private companion object {
        const val FRAME_MARGIN: Long = 50
        const val PULSE_SAMPLES: Int = 4
        val screenBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
            listOf(MyGameSizes.control, MyGameSizes.placeCard),
        )
        val screenBlockCount: Int = screenBlocks.heights.size
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}
