package com.emm.mygame.feature.town.status

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.feature.town.readInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class TownStatusTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val released: LessonName = LessonName.Released(PlacementBand.Second, set = 3)

    @Test
    fun `draws the running released lesson by its band and set`() {
        val running = TownStatusUiState.RunningLesson(name = released, remaining = 5.minutes, finishesAt = readInstant)

        show(TownStatusUiState(running = running, notice = null))

        composeRule.onNodeWithText("Palabras que vuelven: banda 2, grupo 3 listas en").assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `draws a running lesson's whole time at 360 by 640 and font scale 2`() {
        val running = TownStatusUiState.RunningLesson(
            name = released,
            remaining = 125.minutes,
            finishesAt = readInstant,
        )

        show(TownStatusUiState(running = running, notice = null))

        assertDrawnWhole(composeRule.onNodeWithText("2 h 5 min", substring = true))
    }

    @Test
    fun `draws the finished released lesson by its band and set`() {
        show(TownStatusUiState(running = null, notice = TownStatusUiState.FinishNotice(released)))

        composeRule.onNodeWithText(RELEASED_FINISH_LINE).assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
    }

    @Test
    fun `sets the finish line in body ink`() {
        var ink: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                ink = MyGameTheme.colors.ink
                TownStatus(
                    state = TownStatusUiState(running = null, notice = TownStatusUiState.FinishNotice(released)),
                    onNoticeClose = {},
                )
            }
        }

        val line: TextStyle = textStyleOf(RELEASED_FINISH_LINE)
        assertEquals(MyGameTypography.body.fontSize, line.fontSize)
        assertEquals(MyGameTypography.body.fontWeight, line.fontWeight)
        assertEquals(ink, line.color)
    }

    @Test
    fun `draws the finish notice's close as its only control`() {
        show(TownStatusUiState(running = null, notice = TownStatusUiState.FinishNotice(released)))

        composeRule.onAllNodes(hasClickAction()).assertCountEquals(1)
        composeRule.onNode(hasClickAction()).assert(hasText(CLOSE))
    }

    private fun assertDrawnWhole(time: SemanticsNodeInteraction) {
        val window: Dp = composeRule.onRoot().getUnclippedBoundsInRoot().right
        val drawn: DpRect = time.getBoundsInRoot()
        val whole: DpRect = time.getUnclippedBoundsInRoot()
        assertEquals("the time's drawn bounds", whole, drawn)
        assertTrue("the time ends at ${whole.right}, inside $window", whole.right <= window)
        val layout: TextLayoutResult = layoutOf(time)
        (0 until layout.lineCount).forEach { line: Int ->
            assertFalse("line $line is cut short", layout.isLineEllipsized(line))
            assertTrue("line $line ends inside the time", layout.getLineRight(line) <= layout.size.width)
            assertTrue("line $line sits inside the time", layout.getLineBottom(line) <= layout.size.height)
        }
    }

    private fun layoutOf(node: SemanticsNodeInteraction): TextLayoutResult {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        node.fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first()
    }

    private fun textStyleOf(text: String): TextStyle = layoutOf(composeRule.onNodeWithText(text)).layoutInput.style

    private fun show(state: TownStatusUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownStatus(state = state, onNoticeClose = {})
            }
        }
    }

    private companion object {
        const val RELEASED_FINISH_LINE: String = "Las palabras que vuelven de la banda 2, grupo 3 terminaron."
        const val CLOSE: String = "Cerrar"
    }
}
