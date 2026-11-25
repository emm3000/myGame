package com.emm.mygame

import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.feature.town.status.TOWN_DOCK
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import androidx.compose.ui.unit.DpRect as Rect

@RunWith(RobolectricTestRunner::class)
class DockLayoutNavigationTest : DockFrameFixture() {

    @Test
    @Config(qualifiers = "+w411dp-h914dp-420dpi")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a loading dock stays above the navigation bar`() {
        showing(Destination.Today, Destination.Town, townReads = 0)
        composeRule.systemBars(height = NAVIGATION_BAR)
        waitFor(hasTestTag(INK_PILL).and(hasStateDescription(WAITING)).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
        composeRule.waitForIdle()

        val dock: SemanticsNode = composeRule.onNode(hasTestTag(TOWN_DOCK)).fetchSemanticsNode()
        val window: Int = composeRule.onRoot().fetchSemanticsNode().size.height
        assertTrue(dock.boundsInRoot.bottom <= window - NAVIGATION_BAR)
    }

    @Test
    @Config(qualifiers = "+w891dp-h411dp-land")
    fun `the dock keeps its go button clear of a side navigation bar and a cutout`() {
        showing(Destination.Today, Destination.Town, Destination.School, town = playedTown(nextStep = releasedLesson))
        composeRule.sideBars(navigationBar = SIDE_BAR, cutout = CUTOUT)
        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        val window: Dp = composeRule.onRoot().getBoundsInRoot().right

        assertTrue(go.left >= SIDE_BAR.dp && go.right <= window - CUTOUT.dp)
    }

    @Test
    fun `the dock hides while the keyboard is open`() {
        showing(Destination.Today, Destination.Town, Destination.School)
        dockGo("Ir al informe")

        composeRule.keyboard(isOpen = true)

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
        composeRule.keyboard(isOpen = false)
        dockGo("Ir al informe")
    }

    @Test
    @Config(qualifiers = "+w411dp-h915dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal is drawn above the go button at font scale 1 on a 411 by 915 window`() {
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(Destination.Today, Destination.Town, Destination.School, town = playedTown(nextStep = releasedLesson))

        dockGo(STUDY_RELEASED).performClick()
        waitFor(inTheDock(STUDY_SLOT_BUSY))

        val refusal: Rect = composeRule.onNode(inTheDock(STUDY_SLOT_BUSY)).getBoundsInRoot()
        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        assertTrue(refusal.bottom <= go.top)
        composeRule.onAllNodes(foldedRefusal).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folds to the top of the scrolling area, in view, at font scale 2 on a 360 by 640 window`() {
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(Destination.Today, Destination.Town, Destination.School, town = playedTown(nextStep = releasedLesson))
        waitFor(hasText("Escuela").and(isHeading()))
        composeRule.onAllNodes(hasScrollAction()).onFirst().performTouchInput { swipeUp() }

        dockGo(STUDY_RELEASED).performClick()
        waitFor(foldedRefusal)

        val refusal: Rect = composeRule.onNode(foldedRefusal).assertIsDisplayed().getBoundsInRoot()
        val title: Rect = composeRule.onNode(hasText("Escuela").and(isHeading())).getBoundsInRoot()
        assertTrue(refusal.bottom <= title.top)
        composeRule.onAllNodes(inTheDock(STUDY_SLOT_BUSY)).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `the go button keeps its whole label on screen at font scale 2 on a 360 by 640 window`() {
        showing(Destination.Today, Destination.Town, Destination.School, town = playedTown(nextStep = releasedLesson))

        val go: Rect = dockGo(STUDY_RELEASED).getBoundsInRoot()
        val window: Rect = composeRule.onRoot().getBoundsInRoot()

        assertTrue(go.top >= window.top && go.bottom <= window.bottom)
    }

    private companion object {
        const val NAVIGATION_BAR: Int = 63
        const val SIDE_BAR: Int = 48
        const val CUTOUT: Int = 30
    }
}
