package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.art.MyGameArt
import com.emm.mygame.core.designsystem.art.MyGameArtTint
import com.emm.mygame.core.designsystem.art.MyGamePlaceArt
import com.emm.mygame.core.designsystem.control.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.control.MyGameTrack
import com.emm.mygame.core.designsystem.control.REGISTERING
import com.emm.mygame.core.designsystem.control.TRACK_FILL
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.frame.MyGameBlockStack
import com.emm.mygame.core.designsystem.navigation.MyGameRing
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameRegisteringAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `lands each row at once at animator scale 0`() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                MyGamePlaceArt(
                    art = MyGameArt(R.drawable.designsystem_place_farm_3, MyGameArtTint.None),
                    risenFrom = MyGameArt(R.drawable.designsystem_place_farm_2, MyGameArtTint.None),
                )
                MyGamePlaceArt(
                    art = MyGameArt(R.drawable.designsystem_place_homes_1, MyGameArtTint.None),
                    risenFrom = MyGameArt(R.drawable.designsystem_place_homes_0, MyGameArtTint.SurfaceSunken),
                )
                MyGameRing(
                    count = 2,
                    total = 5,
                    countBefore = 1,
                    label = MyGameLabel(text = "2 of 5 words learned", translation = null),
                )
                MyGameBlockStack(nearHue = MyGameBlockHue.Mint, farHue = null, dealtKey = 1) { DealtCard() }
            }
        }

        val landed: List<Pair<MyGameRegisteredRow, Float>> =
            composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
                .fetchSemanticsNodes()
                .map { node -> node.config[REGISTERING].let { registering -> registering.row to registering.fraction } }

        assertEquals(
            listOf(
                MyGameRegisteredRow.Window to 1f,
                MyGameRegisteredRow.Hue to 1f,
                MyGameRegisteredRow.Ring to 1f,
                MyGameRegisteredRow.Deal to 1f,
            ),
            landed,
        )
    }

    @Test
    fun `lands the progress line at once at animator scale 0`() {
        var filled: Float by mutableFloatStateOf(0.5f)
        composeRule.setContent {
            MyGameTheme {
                MyGameTrack(filled = filled, color = MyGameTheme.colors.action, modifier = Modifier.width(200.dp))
            }
        }
        composeRule.waitForIdle()
        composeRule.mainClock.autoAdvance = false
        filled = 1f
        composeRule.waitForIdle()
        repeat(times = 3) { composeRule.mainClock.advanceTimeByFrame() }

        val bounds: DpRect = composeRule.onNodeWithTag(TRACK_FILL, useUnmergedTree = true).getUnclippedBoundsInRoot()
        assertEquals(200.dp, bounds.right - bounds.left)
    }

    private companion object {
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}
