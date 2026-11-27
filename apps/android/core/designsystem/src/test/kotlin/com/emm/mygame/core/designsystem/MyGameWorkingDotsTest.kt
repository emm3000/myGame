package com.emm.mygame.core.designsystem

import androidx.compose.ui.semantics.SemanticsConfiguration
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.control.WORKING_DOTS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_ALPHAS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_OFFSETS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_PEAK_MILLIS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_SCALES
import com.emm.mygame.core.designsystem.control.WORKING_DOT_STAGGER_MILLIS
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameWorkingDotsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `lifts, grows and lights each dot in turn`() {
        drawDots()

        val peaks: List<List<Int>> = (0 until DOTS).map { dot: Int ->
            composeRule.mainClock.advanceTimeBy(untilPeakOf(dot))
            peakingDots()
        }

        assertEquals(List(DOTS) { dot: Int -> List(POSE_PARTS) { dot } }, peaks)
    }

    private fun drawDots() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                MyGameWorkingDots(tint = MyGameTheme.colors.ink)
            }
        }
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun untilPeakOf(dot: Int): Long =
        if (dot == 0) WORKING_DOT_PEAK_MILLIS.toLong() else WORKING_DOT_STAGGER_MILLIS.toLong()

    private fun peakingDots(): List<Int> {
        val pose: SemanticsConfiguration = composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config
        val offsets: List<Dp> = pose[WORKING_DOT_OFFSETS]
        val scales: List<Float> = pose[WORKING_DOT_SCALES]
        val alphas: List<Float> = pose[WORKING_DOT_ALPHAS]
        return listOf(
            offsets.indexOf(offsets.min()),
            scales.indexOf(scales.max()),
            alphas.indexOf(alphas.max()),
        )
    }

    private companion object {
        const val DOTS: Int = 3
        const val POSE_PARTS: Int = 3
    }
}
