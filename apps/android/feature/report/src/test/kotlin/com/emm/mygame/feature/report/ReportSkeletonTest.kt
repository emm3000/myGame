package com.emm.mygame.feature.report

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReportSkeletonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<ReportIntent> = mutableListOf()

    private var state: ReportUiState by mutableStateOf(ReportUiState.Loading)

    private val nothingDue: ReportUiState = ReportUiState.Content(
        dueCount = 0,
        firstUnread = null,
        nextReview = null,
        news = ReportUiState.ReportNews.None,
        receivedAt = readInstant,
    )

    @Test
    fun `shows the skeleton when the read is slow`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        assertEquals(BLOCKS, drawnBlocks())
    }

    @Test
    fun `draws no skeleton when the Report answers inside the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)

        answer(nothingDue)
        composeRule.onNodeWithText(NOTHING_DUE).assertExists()
        val drawnAtTheAnswer: Int = drawnBlocks()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        assertEquals(listOf(0, 0), listOf(drawnAtTheAnswer, drawnBlocks()))
    }

    @Test
    fun `keeps the skeleton for the minimum hold when the Report answers just after it appears`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        answer(nothingDue)
        composeRule.mainClock.advanceTimeBy(insideHold)

        assertEquals(BLOCKS, drawnBlocks())
        composeRule.onAllNodesWithText(NOTHING_DUE).assertCountEquals(0)
    }

    @Test
    fun `draws the Report once the minimum hold has passed`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(pastReveal)

        answer(nothingDue)
        composeRule.mainClock.advanceTimeBy(pastHold)

        assertEquals(0, drawnBlocks())
        composeRule.onNodeWithText(NOTHING_DUE).assertExists()
    }

    @Test
    fun `never draws the reading line`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(beforeReveal)
        composeRule.onAllNodesWithText(READING_LINE).assertCountEquals(0)

        composeRule.mainClock.advanceTimeBy(pastReveal)
        composeRule.onAllNodesWithText(READING_LINE).assertCountEquals(0)
    }

    @Test
    fun `speaks the reading line in a polite live region`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onNodeWithContentDescription(READING_LINE)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `offers the retry when the first read fails inside the reveal delay`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)

        answer(ReportUiState.Failed)
        composeRule.onNodeWithText(FAILED_LINE).assertExists()
        composeRule.onNodeWithText(RETRY).performClick()

        assertEquals(listOf<ReportIntent>(ReportIntent.RetryTapped), intents)
    }

    @Test
    fun `keeps the error banner through the wait after a failed first read`() {
        drawLoading()
        composeRule.mainClock.advanceTimeBy(beforeReveal)

        answer(ReportUiState.Failed)
        composeRule.mainClock.advanceTimeBy(pastReveal + pastHold)

        assertEquals(0, drawnBlocks())
        composeRule.onNodeWithText(FAILED_LINE).assertExists()
    }

    @Test
    fun `offers the sign out under the skeleton`() {
        drawLoading()

        composeRule.mainClock.advanceTimeBy(pastReveal)

        composeRule.onNodeWithText(SIGN_OUT).assertExists()
    }

    private fun drawLoading() {
        composeRule.mainClock.autoAdvance = false
        composeRule.setContent {
            MyGameTheme {
                ReportScreen(
                    state = state,
                    onIntent = { intent: ReportIntent -> intents += intent },
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }
    }

    private fun answer(answered: ReportUiState) {
        state = answered
        composeRule.waitForIdle()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun drawnBlocks(): Int =
        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).fetchSemanticsNodes().size

    private companion object {
        const val READING_LINE: String = "Estamos leyendo tu informe…"
        const val NOTHING_DUE: String = "No tienes repasos pendientes ahora."
        const val FAILED_LINE: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val RETRY: String = "Volver a intentarlo"
        const val SIGN_OUT: String = "Salir"
        const val BLOCKS: Int = 4
        const val FRAME_MARGIN: Long = 50
        val beforeReveal: Long = MyGameTransitions.REVEAL_MILLIS - FRAME_MARGIN
        val pastReveal: Long = MyGameTransitions.REVEAL_MILLIS + FRAME_MARGIN
        val insideHold: Long = MyGameTransitions.HOLD_MILLIS - 2 * FRAME_MARGIN
        val pastHold: Long = MyGameTransitions.HOLD_MILLIS + 2 * FRAME_MARGIN
    }
}
