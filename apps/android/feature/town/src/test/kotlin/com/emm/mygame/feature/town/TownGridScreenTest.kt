package com.emm.mygame.feature.town

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameRing
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.uitesting.assertRingOnTitleRow
import com.emm.mygame.core.uitesting.tabRingLabel
import com.emm.mygame.feature.town.building.PlaceCard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
class TownGridScreenTest : TownScreenFixture() {

    @Test
    fun `each card states the place's name, its level and its state in words`() {
        show(mixedTown)

        card("Granja").assert(hasText("Nivel 1")).assert(hasText("Puedes construir el nivel 2."))
        card("Fábrica").assert(hasText("Nivel 1")).assert(hasText("Gente necesaria: 3. Libres: 0."))
        card("Hogares").assert(hasText("Nivel 1")).assert(hasText("En construcción"))
        card("Almacén").assert(hasText("Nivel 10")).assert(hasText("Nivel máximo"))
        card("Oficina").assert(hasText("Sin construir"))
    }

    @Test
    fun `a place with a work the town can start draws that work's button with its cost`() {
        show(mixedTown)

        composeRule.onAllNodesWithText(BUILD_FOR_MONEY).assertCountEquals(STARTABLE_PLACES)
        composeRule.onNodeWithText("Granja").performScrollTo()
        composeRule.onAllNodesWithText(BUILD_FOR_MONEY)[0].performClick()

        assertEquals(listOf(TownIntent.BuildTapped(TownBuildingKind.Homes)), intents)
    }

    @Test
    fun `the rest of the card opens the place's page`() {
        show(mixedTown)

        card("Fábrica").performScrollTo().performClick()

        assertEquals(listOf(TownBuildingKind.Factory), placeOpens)
        assertEquals(emptyList<TownIntent>(), intents)
    }

    @Test
    fun `Town News is a door in Town's header`() {
        show(riverton)

        composeRule.onNode(hasText("Noticias del pueblo") and hasClickAction()).performClick()

        assertEquals(1, newsOpens)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `draws Town's title and the ring on one row`() {
        show(riverton, ring = { MyGameRing(count = 0, total = 5, countBefore = 0, label = tabRingLabel) })

        assertRingOnTitleRow(composeRule, title = "Riverton · Pueblo")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `sets Town News under Town's title`() {
        show(riverton, ring = { MyGameRing(count = 0, total = 5, countBefore = 0, label = tabRingLabel) })

        val title: DpRect = composeRule.onNode(isHeading() and hasText("Riverton · Pueblo")).getUnclippedBoundsInRoot()
        val news: DpRect = composeRule.onNodeWithText("Noticias del pueblo").getUnclippedBoundsInRoot()
        assertEquals(title.left, news.left)
        assertTrue("Town News sits under the title", news.top >= title.bottom)
    }

    @Test
    fun `a place's page draws its own work and no grid`() {
        show(mixedTown, place = TownBuildingKind.Farm)

        composeRule.onNode(hasText("Construir nivel 2", substring = true) and hasClickAction()).assertExists()
        composeRule.onAllNodesWithText(BUILD_FOR_MONEY).assertCountEquals(0)
        composeRule.onAllNodesWithText("Noticias del pueblo").assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `lays two cards side by side on a phone at the default font scale`() {
        show(riverton)

        assertEquals(boundsOf(card("Hogares")).top, boundsOf(card("Granja")).top)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `stacks the cards in one column on a phone at the largest font scale`() {
        show(riverton)

        assertTrue("Granja sits under Hogares", boundsOf(card("Hogares")).bottom <= boundsOf(card("Granja")).top)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `a requested place the town lacks draws the grid, which scrolls to its last card`() {
        show(townWithoutOffice, place = TownBuildingKind.Office)

        card("Almacén").performScrollTo().assertIsDisplayed()
    }

    private fun boundsOf(node: SemanticsNodeInteraction): DpRect = node.getUnclippedBoundsInRoot()

    private val townWithoutOffice: TownUiState.Content = riverton.copy(
        places = riverton.places.filter { place: PlaceCard -> place.kind != TownBuildingKind.Office },
    )

    private fun card(place: String): SemanticsNodeInteraction =
        composeRule.onNode(hasText(place) and hasClickAction())

    private val peopleShort: BlockReason = BlockReason.PeopleShort(needed = 3, free = 0)

    private val mixedTown: TownUiState.Content = riverton.copy(
        places = riverton.places.map { place: PlaceCard ->
            when (place.kind) {
                TownBuildingKind.Factory -> place.copy(block = peopleShort)
                TownBuildingKind.Homes -> place.copy(isInWork = true)
                TownBuildingKind.Storage -> place.copy(level = 10, next = null)
                TownBuildingKind.Office -> place.copy(level = 0, block = peopleShort)
                TownBuildingKind.Farm, TownBuildingKind.School, TownBuildingKind.PowerStation -> place
            }
        },
    )

    private companion object {
        const val BUILD_FOR_MONEY: String = "Construir por 150 de dinero"
        const val STARTABLE_PLACES: Int = 4
    }
}
