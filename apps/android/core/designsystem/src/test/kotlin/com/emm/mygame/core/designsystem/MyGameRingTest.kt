package com.emm.mygame.core.designsystem

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertLeftPositionInRootIsEqualTo
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

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
    fun `draws its label after the thirty-two dp ring`() {
        drawRing()

        composeRule.onNodeWithText(RING_NAME, useUnmergedTree = true)
            .assertIsDisplayed()
            .assertLeftPositionInRootIsEqualTo(40.dp)
    }

    @Test
    fun `reads the ring and its label as one node`() {
        drawRing()

        composeRule.onNodeWithText(RING_NAME).assertLeftPositionInRootIsEqualTo(0.dp)
    }

    @Test
    fun `reads the label once`() {
        drawRing()

        composeRule.onAllNodesWithText(RING_NAME).assertCountEquals(1)
        composeRule.onNodeWithText(RING_NAME)
            .assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.ContentDescription))
    }

    @Test
    fun `draws the ring as decoration with no role of its own`() {
        drawRing()

        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.Role), useUnmergedTree = true)
            .assertCountEquals(0)
    }

    private fun drawRing() {
        composeRule.setContent {
            MyGameTheme {
                MyGameRing(count = 3, total = 5, countBefore = 3, label = RING_LABEL)
            }
        }
    }

    private companion object {
        const val RING_NAME: String = "3 of 5 words learned"
        val RING_LABEL: MyGameLabel = MyGameLabel(text = RING_NAME, translation = null)
    }
}
