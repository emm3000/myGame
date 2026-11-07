package com.emm.mygame.core.designsystem

import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertLeftPositionInRootIsEqualTo
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class MyGameRingTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `draws one mark per word`() {
        assertEquals(5, ringMarksOf(count = 3, total = 5, countBefore = 3).size)
    }

    @Test
    fun `fills the marks of the retained words first`() {
        val filled: List<Boolean> = ringMarksOf(count = 3, total = 5, countBefore = 3).map(RingMark::isRetained)

        assertEquals(listOf(true, true, true, false, false), filled)
    }

    @Test
    fun `moves only the marks the later read retained`() {
        val moving: List<Boolean> = ringMarksOf(count = 3, total = 5, countBefore = 1).map(RingMark::isNewlyRetained)

        assertEquals(listOf(false, true, true, false, false), moving)
    }

    @Test
    fun `starts the first mark at the top of the ring`() {
        assertEquals(-90f, ringMarksOf(count = 0, total = 5, countBefore = 0).first().startDegrees, 1e-3f)
    }

    @Test
    fun `leaves a gap of fifteen hundredths of a word between marks`() {
        val marks: List<RingMark> = ringMarksOf(count = 0, total = 5, countBefore = 0)

        assertEquals(61.2f, marks[0].sweepDegrees, 1e-3f)
        assertEquals(-18f, marks[1].startDegrees, 1e-3f)
    }

    @Test
    fun `measures thirty-two dp across`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameRing(count = 3, total = 5, countBefore = 3, accessibleName = RING_NAME)
            }
        }

        composeRule.onNodeWithContentDescription(RING_NAME).assertWidthIsEqualTo(32.dp).assertHeightIsEqualTo(32.dp)
    }

    @Test
    @Config(qualifiers = "w360dp-h800dp")
    fun `keeps the ring on the right of a long name at 360 dp`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameHeader(end = { MyGameRing(count = 3, total = 5, countBefore = 3, accessibleName = RING_NAME) }) {
                    MyGameMetaText(text = LONG_NAME, color = MyGameTheme.colors.inkMuted)
                }
            }
        }

        composeRule.onNodeWithContentDescription(RING_NAME).assertLeftPositionInRootIsEqualTo(328.dp)
    }

    private companion object {
        const val RING_NAME: String = "3 of 5 words learned"
        const val LONG_NAME: String = "Saint Bartholomew of the Seven Rivers and the Long Valley · Town"
    }
}
