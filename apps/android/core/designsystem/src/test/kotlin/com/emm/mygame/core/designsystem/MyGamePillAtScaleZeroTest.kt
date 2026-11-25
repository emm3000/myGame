package com.emm.mygame.core.designsystem

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGamePillAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `holds a working button's dots still at animator scale 0`() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                MyGameButton(
                    label = MyGameLabel(text = "Build level 2", translation = null),
                    isBusy = true,
                    busyDescription = MyGameLabel(text = "Sending to the town", translation = null),
                    onClick = {},
                )
            }
        }

        val samples: List<List<Float>> = (1..SAMPLES).map {
            composeRule.mainClock.advanceTimeBy(MyGameTransitions.CALM_MILLIS.toLong() / 2)
            composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true)
                .fetchSemanticsNode()
                .config[WORKING_DOT_ALPHAS]
        }

        assertEquals(List(SAMPLES) { List(DOTS) { 1f } }, samples)
    }

    private companion object {
        const val SAMPLES: Int = 4
        const val DOTS: Int = 3
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}
