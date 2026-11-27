package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.frame.SKELETON_BLOCK
import com.emm.mygame.core.designsystem.theme.MyGameTransitions
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownReadStatesScreenTest : TownScreenFixture() {

    @Test
    fun `draws the skeleton's blocks while a slow read loads`() {
        showSlowRead()

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(5)
    }

    @Test
    fun `draws the reading line once the read is slower than the reveal delay`() {
        composeRule.mainClock.autoAdvance = false
        show(TownUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS - REVEAL_MARGIN_MILLIS)
        val drawnBeforeTheReveal: Int = drawnReadingLines()

        composeRule.mainClock.advanceTimeBy(2 * REVEAL_MARGIN_MILLIS)

        assertEquals(listOf(0, 1), listOf(drawnBeforeTheReveal, drawnReadingLines()))
    }

    private fun drawnReadingLines(): Int =
        composeRule.onAllNodesWithText(READING_LINE, useUnmergedTree = true).fetchSemanticsNodes().size

    @Test
    fun `speaks the reading line in a polite live region`() {
        showSlowRead()

        composeRule.onNodeWithContentDescription(READING_LINE)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `asks for a retry on a failed read`() {
        show(TownUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.RetryTapped), intents)
    }
}
