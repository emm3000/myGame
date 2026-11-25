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
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.placement.Placement
import com.emm.mygame.core.model.placement.PlacementReadResult
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w360dp-h640dp", fontScale = 2f)
class PlacementWayOnTest : DockFrameFixture() {

    private val start: SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(START, substring = true).or(hasText(START)))

    private val skip: SemanticsMatcher = hasTestTag(OUTLINED_PILL).and(hasText(SKIP))

    private val inScroll: SemanticsMatcher = hasAnyAncestor(hasScrollAction())

    @Test
    fun `the placement's way on sits at the foot of its content, reached by scrolling, and no dock is drawn`() {
        repeat(2) { placements.answerRead(PlacementReadResult.Read(Placement.Offered)) }
        showing(Destination.Today, Destination.School, Destination.Placement)
        waitFor(start)

        composeRule.onNode(start).assert(inScroll).performScrollTo().assertIsDisplayed()
        composeRule.onAllNodes(hasTestTag(INK_PILL).and(inScroll.not())).assertCountEquals(0)
        val skipBottom: Dp = composeRule.onNode(skip).getUnclippedBoundsInRoot().bottom
        assertTrue(skipBottom <= composeRule.onNode(start).getUnclippedBoundsInRoot().top)
    }

    private companion object {
        const val START: String = "Empezar la prueba"
        const val SKIP: String = "Saltar la prueba"
    }
}
