package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameRegisteringTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val levelTwo: MyGameArt = MyGameArt(R.drawable.designsystem_place_farm_2, MyGameArtTint.None)

    private val levelThree: MyGameArt = MyGameArt(R.drawable.designsystem_place_farm_3, MyGameArtTint.None)

    private val notBuilt: MyGameArt = MyGameArt(R.drawable.designsystem_place_farm_0, MyGameArtTint.SurfaceSunken)

    private val firstBuilt: MyGameArt = MyGameArt(R.drawable.designsystem_place_farm_1, MyGameArtTint.None)

    @Test
    fun `pops the new window when a level finishes`() {
        drawInFlight { MyGamePlaceArt(art = levelThree, risenFrom = levelTwo) }

        assertInFlight(MyGameRegisteredRow.Window)
    }

    @Test
    fun `gives a place its hue when first built`() {
        drawInFlight { MyGamePlaceArt(art = firstBuilt, risenFrom = notBuilt) }

        assertInFlight(MyGameRegisteredRow.Hue)
    }

    @Test
    fun `plays nothing for a place that did not rise`() {
        drawInFlight { MyGamePlaceArt(art = levelThree, risenFrom = null) }

        assertPlaysNothing()
    }

    @Test
    fun `moves the ring when a word is retained`() {
        drawInFlight { MyGameRing(count = 2, total = 5, countBefore = 1, accessibleName = RING_NAME) }

        assertInFlight(MyGameRegisteredRow.Ring)
    }

    @Test
    fun `plays nothing for a ring that did not rise`() {
        drawInFlight { MyGameRing(count = 2, total = 5, countBefore = 2, accessibleName = RING_NAME) }

        assertPlaysNothing()
    }

    @Test
    fun `speaks the ring once it rises`() {
        drawInFlight { MyGameRing(count = 2, total = 5, countBefore = 1, accessibleName = RING_NAME) }

        assertTrue(isLive(RING_NAME))
    }

    @Test
    fun `keeps a ring that did not rise silent`() {
        drawInFlight { MyGameRing(count = 2, total = 5, countBefore = 2, accessibleName = RING_NAME) }

        assertFalse(isLive(RING_NAME))
    }

    @Test
    fun `deals the next card off the stack`() {
        drawInFlight { MyGameBlockStack(nearHue = MyGameBlockHue.Mint, farHue = null, dealtKey = 1) { DealtCard() } }

        assertInFlight(MyGameRegisteredRow.Deal)
    }

    @Test
    fun `changes the card in place when nothing is dealt`() {
        drawInFlight { MyGameBlockStack(nearHue = MyGameBlockHue.Mint, farHue = null, dealtKey = null) { DealtCard() } }

        assertPlaysNothing()
    }

    @Test
    fun `moves the progress line in calm`() {
        var filled: Float by mutableFloatStateOf(0.5f)
        composeRule.setContent {
            MyGameTheme { MyGameTrack(filled = filled, color = MyGameTheme.colors.action, modifier = trackWidth) }
        }
        composeRule.waitForIdle()
        composeRule.mainClock.autoAdvance = false
        filled = 1f
        composeRule.waitForIdle()
        repeat(times = 3) { composeRule.mainClock.advanceTimeByFrame() }

        val width: Dp = fillWidth()
        assertTrue(width > TRACK_WIDTH / 2 && width < TRACK_WIDTH)
    }

    private fun drawInFlight(row: @Composable () -> Unit) {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent { MyGameTheme { row() } }
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun assertInFlight(row: MyGameRegisteredRow) {
        val registering: MyGameRegistering = registeringNode()
        assertEquals(row, registering.row)
        assertTrue(registering.fraction < 1f)
    }

    private fun assertPlaysNothing() {
        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .let { nodes -> assertTrue(nodes.isEmpty()) }
    }

    private fun registeringNode(): MyGameRegistering =
        composeRule.onNode(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[REGISTERING]

    private fun isLive(name: String): Boolean = SemanticsProperties.LiveRegion in
        composeRule.onNodeWithContentDescription(name).fetchSemanticsNode().config

    private fun fillWidth(): Dp = composeRule.onNodeWithTag(TRACK_FILL, useUnmergedTree = true)
        .getUnclippedBoundsInRoot()
        .let { bounds -> bounds.right - bounds.left }

    private val trackWidth: Modifier = Modifier.width(TRACK_WIDTH)

    private companion object {
        const val RING_NAME: String = "2 of 5 words learned"
        val TRACK_WIDTH: Dp = 200.dp
    }
}

@Composable
internal fun DealtCard() {
    MyGameBlock(hue = MyGameBlockHue.Peach) {
        MyGameText(text = "word", style = MyGameTypography.body, color = MyGameTheme.colors.onBlock)
    }
}
