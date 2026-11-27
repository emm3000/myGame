package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.feature.town.building.StockLine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TownStocksStripTest : TownScreenFixture() {

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `lays the four stocks side by side on a phone at the default font scale`() {
        show(thousandTown)

        val boxes: List<DpRect> = AMOUNTS.map { amount: String -> boundsOf(text(amount)) }
        assertEquals(listOf(boxes.first().top), boxes.map { box: DpRect -> box.top }.distinct())
        assertEquals(boxes.sortedBy { box: DpRect -> box.left }, boxes)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `each stock stacks its amount, its name and its capacity`() {
        show(thousandTown)

        val amount: DpRect = boundsOf(text("400"))
        val name: DpRect = boundsOf(text("dinero"))
        val capacity: DpRect = boundsOf(composeRule.onAllNodesWithText(OF_THOUSAND, useUnmergedTree = true)[0])
        assertTrue("the name sits under the amount", amount.bottom <= name.top)
        assertTrue("the capacity sits under the name", name.bottom <= capacity.top)
        assertEquals(amount.left, capacity.left)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `every amount and capacity is shown whole on one line at the largest font scale`() {
        show(thousandTown)

        (AMOUNTS + NAMES).forEach { whole: String -> assertShownWhole(text(whole), whole) }
        val capacities: Int =
            composeRule.onAllNodesWithText(OF_THOUSAND, useUnmergedTree = true).fetchSemanticsNodes().size
        assertEquals(TownResourceKind.entries.size, capacities)
        repeat(capacities) { index: Int ->
            assertShownWhole(composeRule.onAllNodesWithText(OF_THOUSAND, useUnmergedTree = true)[index], OF_THOUSAND)
        }
    }

    private fun assertShownWhole(node: SemanticsNodeInteraction, whole: String) {
        node.performScrollTo().assertIsDisplayed()
        val layout: TextLayoutResult = layoutOf(node)
        assertEquals("$whole stays on one line", 1, layout.lineCount)
        assertFalse("$whole is cut at its foot", layout.didOverflowHeight)
    }

    private fun text(whole: String): SemanticsNodeInteraction =
        composeRule.onNodeWithText(whole, useUnmergedTree = true)

    private fun boundsOf(node: SemanticsNodeInteraction): DpRect = node.getUnclippedBoundsInRoot()

    private fun layoutOf(node: SemanticsNodeInteraction): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        node.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {
                read: (MutableList<TextLayoutResult>) -> Boolean ->
            read(layouts)
        }
        return layouts.single()
    }

    private val thousandTown: TownUiState.Content = riverton.copy(
        stocks = TownResourceKind.entries.zip(AMOUNTS) { kind: TownResourceKind, amount: String ->
            StockLine(kind, amount.toLong(), capacity = 1000, ratePerHour = 30, skillLevel = 0, fill = null)
        },
    )

    private companion object {
        val AMOUNTS: List<String> = listOf("400", "300", "200", "500")
        val NAMES: List<String> = listOf("dinero", "comida", "energía", "material")
        const val OF_THOUSAND: String = "de 1 000"
    }
}
