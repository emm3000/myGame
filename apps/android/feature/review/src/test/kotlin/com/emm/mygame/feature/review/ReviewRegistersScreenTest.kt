package com.emm.mygame.feature.review

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.MyGameRegistering
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReviewRegistersScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `deals the next card on a right answer`() {
        drawInFlight(dealtSchool)

        assertInFlight(MyGameRegisteredRow.Deal)
    }

    @Test
    fun `changes the card in place after a wrong answer`() {
        drawInFlight(dealtSchool.copy(isDealtFromStack = false))

        assertEquals(emptyList<MyGameRegistering>(), registeringNodesOf(composeRule))
    }

    @Test
    fun `stacks the next hues behind the card`() {
        drawInFlight(dealtSchool.copy(dueCount = 5))

        assertEquals(
            listOf(MyGameBlockHue.Lavender, MyGameBlockHue.Periwinkle, MyGameBlockHue.Mint),
            blockHues(),
        )
    }

    @Test
    fun `stacks no more cards than are due after this one`() {
        drawInFlight(dealtSchool.copy(dueCount = 1))

        assertEquals(listOf(MyGameBlockHue.Mint), blockHues())
    }

    @Test
    fun `changes the rate with the skill verdict`() {
        drawInFlight(skillEarned)

        assertInFlight(MyGameRegisteredRow.Rate)
    }

    @Test
    fun `speaks each row once`() {
        drawInFlight(skillEarned.copy(isDealtFromStack = true))

        assertEquals(1, liveNodesHolding("The kids walk to school.").size)
        assertEquals(1, liveNodesHolding("+19 / h").size)
    }

    private fun drawInFlight(state: ReviewUiState) {
        composeRule.mainClock.autoAdvance = false
        drawReview(composeRule, state)
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun assertInFlight(row: MyGameRegisteredRow) {
        val registering: MyGameRegistering = registeringNodesOf(composeRule).single()
        assertEquals(row, registering.row)
        assertTrue(registering.fraction < 1f)
    }

    private fun blockHues(): List<MyGameBlockHue> =
        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(BLOCK_HUE), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .map { node -> node.config[BLOCK_HUE] }

    private fun liveNodesHolding(text: String): List<Any> =
        composeRule.onAllNodes(
            SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion) and hasText(text, substring = true),
        ).fetchSemanticsNodes()
}
