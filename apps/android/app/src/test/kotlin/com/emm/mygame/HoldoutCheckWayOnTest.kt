package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckChangeResult
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.holdout.HoldoutChecksReadResult
import com.emm.mygame.core.model.placement.PlacementBand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w360dp-h640dp", fontScale = 2f)
class HoldoutCheckWayOnTest : DockFrameFixture() {

    private val due: HoldoutCheck = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)

    private val check: Destination.HoldoutCheck = Destination.HoldoutCheck(due.band, due.week)

    private val start: SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(START, substring = true).or(hasText(START)))

    private val skip: SemanticsMatcher = hasTestTag(OUTLINED_PILL).and(hasText(SKIP))

    private val done: SemanticsMatcher = hasTestTag(INK_PILL).and(hasText(DONE))

    private val inScroll: SemanticsMatcher = hasAnyAncestor(hasScrollAction())

    @Test
    fun `the holdout check's way on sits at the foot of its content, reached by scrolling, and no dock is drawn`() {
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(listOf(due)))
        showing(Destination.Today, Destination.School, check)
        waitFor(start)

        composeRule.onNode(start).assert(inScroll).performScrollTo().assertIsDisplayed()
        composeRule.onAllNodes(hasTestTag(INK_PILL).and(inScroll.not())).assertCountEquals(0)
        val skipBottom: Dp = composeRule.onNode(skip).getUnclippedBoundsInRoot().bottom
        assertTrue(skipBottom <= composeRule.onNode(start).getUnclippedBoundsInRoot().top)
    }

    @Test
    fun `when the check ends, its way on returns to the screen that opened it`() {
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(listOf(due)))
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Changed(emptyList()))
        showing(Destination.Today, Destination.School, check)
        waitFor(skip)

        composeRule.onNode(skip).performScrollTo().performClick()
        waitFor(done)
        composeRule.onNode(done).assert(inScroll).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() == Destination.School }
        assertEquals(listOf(Destination.Today, Destination.School), shownStack?.toList())
    }

    private companion object {
        const val START: String = "Empezar la prueba"
        const val SKIP: String = "Saltar la prueba"
        const val DONE: String = "Continuar"
    }
}
