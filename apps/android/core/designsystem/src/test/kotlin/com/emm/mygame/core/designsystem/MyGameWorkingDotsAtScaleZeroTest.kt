package com.emm.mygame.core.designsystem

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.semantics.SemanticsConfiguration
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.control.WORKING_DOTS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_ALPHAS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_OFFSETS
import com.emm.mygame.core.designsystem.control.WORKING_DOT_SCALES
import com.emm.mygame.core.designsystem.control.WORKING_DOT_STAGGER_MILLIS
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameWorkingDotsAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `holds every dot still, unlifted, at full size and full alpha at animator scale 0`() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                MyGameWorkingDots(tint = MyGameTheme.colors.ink)
            }
        }

        val samples: List<List<Any>> = (1..SAMPLES).map {
            composeRule.mainClock.advanceTimeBy(WORKING_DOT_STAGGER_MILLIS.toLong())
            pose()
        }

        assertEquals(List(SAMPLES) { listOf(List(DOTS) { 0.dp }, List(DOTS) { 1f }, List(DOTS) { 1f }) }, samples)
    }

    private fun pose(): List<Any> {
        val config: SemanticsConfiguration = composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config
        return listOf(config[WORKING_DOT_OFFSETS], config[WORKING_DOT_SCALES], config[WORKING_DOT_ALPHAS])
    }

    private companion object {
        const val SAMPLES: Int = 4
        const val DOTS: Int = 3
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}
