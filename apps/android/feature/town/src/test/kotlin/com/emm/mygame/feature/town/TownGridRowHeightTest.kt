package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.feature.town.building.PlaceCard
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
class TownGridRowHeightTest : TownScreenFixture() {

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `the two cards of a row stand at one height when one build label wraps further than the other`() {
        show(longCostHomes)

        val shortLines: Int =
            layoutOf(composeRule.onAllNodesWithText(BUILD_FOR_MONEY, useUnmergedTree = true)[0]).lineCount
        assertTrue("the Hogares label wraps further", layoutOf(text(LONG_BUILD)).lineCount > shortLines)
        assertEquals(heightOf(card("Hogares")), heightOf(card("Granja")))
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `every card's text is shown whole on a phone at the largest font scale`() {
        show(longCostFarm)

        wholeTexts.forEach { whole: String ->
            val matches: Int = composeRule.onAllNodesWithText(whole, useUnmergedTree = true).fetchSemanticsNodes().size
            assertTrue("$whole is drawn", matches > 0)
            repeat(matches) { index: Int -> assertShownWhole(whole, index) }
        }
    }

    private fun assertShownWhole(whole: String, index: Int) {
        val node: SemanticsNodeInteraction =
            composeRule.onAllNodesWithText(whole, useUnmergedTree = true)[index].performScrollTo()
        node.assertIsDisplayed()
        assertFalse("$whole is cut at its foot", layoutOf(node).didOverflowHeight)
    }

    private fun text(whole: String): SemanticsNodeInteraction =
        composeRule.onNodeWithText(whole, useUnmergedTree = true)

    private fun layoutOf(node: SemanticsNodeInteraction): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        node.performSemanticsAction(SemanticsActions.GetTextLayoutResult) {
                read: (MutableList<TextLayoutResult>) -> Boolean ->
            read(layouts)
        }
        return layouts.single()
    }

    private fun heightOf(node: SemanticsNodeInteraction): Dp =
        node.getUnclippedBoundsInRoot().let { box: DpRect -> box.bottom - box.top }

    private fun card(place: String): SemanticsNodeInteraction =
        composeRule.onNode(hasText(place) and hasClickAction())

    private val peopleShort: BlockReason = BlockReason.PeopleShort(needed = 3, free = 0)

    private val threeCosts: NextLevelLine = levelTwo.copy(
        costs = listOf(
            CostLine(TownResourceKind.Money, 90, isShort = false),
            CostLine(TownResourceKind.Food, 60, isShort = false),
            CostLine(TownResourceKind.Material, 120, isShort = false),
        ),
    )

    private val longCostHomes: TownUiState.Content = riverton.copy(
        places = riverton.places.map { place: PlaceCard ->
            if (place.kind == TownBuildingKind.Homes) place.copy(next = threeCosts) else place
        },
    )

    private val longCostFarm: TownUiState.Content = riverton.copy(
        places = riverton.places.map { place: PlaceCard ->
            when (place.kind) {
                TownBuildingKind.Farm -> place.copy(next = threeCosts)
                TownBuildingKind.Factory -> place.copy(block = peopleShort)
                TownBuildingKind.Homes -> place.copy(isInWork = true)
                TownBuildingKind.Storage -> place.copy(level = 10, next = null)
                TownBuildingKind.Office -> place.copy(level = 0, block = peopleShort)
                TownBuildingKind.School, TownBuildingKind.PowerStation -> place
            }
        },
    )

    private val wholeTexts: List<String> = listOf(
        "Hogares",
        "Granja",
        "Escuela",
        "Oficina",
        "Fábrica",
        "Central eléctrica",
        "Almacén",
        "Nivel 1",
        "Nivel 10",
        "Sin construir",
        "En construcción",
        "Puedes construir el nivel 2.",
        "Gente necesaria: 3. Libres: 0.",
        "Nivel máximo",
        BUILD_FOR_MONEY,
        LONG_BUILD,
    )

    private companion object {
        const val BUILD_FOR_MONEY: String = "Construir por 150 de dinero"
        const val LONG_BUILD: String = "Construir por 90 de dinero, 60 de comida y 120 de material"
    }
}
