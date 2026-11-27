package com.emm.mygame.core.designsystem

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val BUILD: String = "Build level 2"

private const val SENDING: String = "Sending to the town"

private const val SHORT_OF_FOOD: String = "You need 40 more food. Ready in 24 min."

@RunWith(RobolectricTestRunner::class)
class MyGamePillStatesTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(isBusy: Boolean, blockedReason: String?) {
        composeRule.setContent {
            MyGameTheme {
                MyGameOutlinedButton(
                    label = MyGameLabel(text = BUILD, translation = null),
                    isBusy = isBusy,
                    busyDescription = MyGameLabel(text = SENDING, translation = null),
                    onClick = {},
                    blockedReason = blockedReason?.let { reason: String ->
                        MyGameLabel(text = reason, translation = null)
                    },
                )
            }
        }
    }

    private fun dotAlphas(): List<Float> =
        composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[WORKING_DOT_ALPHAS]

    @Test
    fun `a working button draws three dots inside its edge`() {
        show(isBusy = true, blockedReason = null)

        composeRule
            .onNode(hasTestTag(WORKING_DOTS) and hasAnyAncestor(hasTestTag(OUTLINED_PILL)), useUnmergedTree = true)
            .assertIsDisplayed()
        assertEquals(DOTS, dotAlphas().size)
    }

    @Test
    fun `a working button's dots pulse in turn`() {
        composeRule.mainClock.autoAdvance = false
        show(isBusy = true, blockedReason = null)

        val brightest: List<Int> = (0 until DOTS).map { turn: Int ->
            composeRule.mainClock.advanceTimeBy(if (turn == 0) HALF_BEAT_MILLIS else BEAT_MILLIS)
            dotAlphas().withIndex().maxBy { dot: IndexedValue<Float> -> dot.value }.index
        }

        assertEquals(listOf(0, 1, 2), brightest)
    }

    @Test
    fun `a working button says what is happening in view`() {
        show(isBusy = true, blockedReason = null)

        composeRule.onNodeWithText(SENDING, useUnmergedTree = true).assertIsDisplayed()
    }

    @Test
    fun `a blocked button draws a lock inside its edge`() {
        show(isBusy = false, blockedReason = SHORT_OF_FOOD)

        composeRule
            .onNode(hasTestTag(BLOCKED_LOCK) and hasAnyAncestor(hasTestTag(OUTLINED_PILL)), useUnmergedTree = true)
            .assertIsDisplayed()
    }

    @Test
    fun `a blocked button draws its reason and what lifts it in view`() {
        show(isBusy = false, blockedReason = SHORT_OF_FOOD)

        composeRule.onNodeWithText(SHORT_OF_FOOD, useUnmergedTree = true).assertIsDisplayed()
    }

    @Test
    fun `a button at rest draws no dots, no lock and no state line`() {
        show(isBusy = false, blockedReason = null)

        composeRule.onNodeWithTag(WORKING_DOTS, useUnmergedTree = true).assertDoesNotExist()
        composeRule.onNodeWithTag(BLOCKED_LOCK, useUnmergedTree = true).assertDoesNotExist()
        composeRule.onNode(hasText(SENDING), useUnmergedTree = true).assertDoesNotExist()
    }

    private companion object {
        const val DOTS: Int = 3
        const val BEAT_MILLIS: Long = MyGameTransitions.CALM_MILLIS.toLong()
        const val HALF_BEAT_MILLIS: Long = BEAT_MILLIS / 2
    }
}
