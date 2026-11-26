package com.emm.mygame.feature.town.building

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.TownScreenFixture
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlaceStocksScreenTest : TownScreenFixture() {

    @Test
    fun `shows each producer's stock on its own page`() {
        val opened: MutableState<TownBuildingKind?> = mutableStateOf(null)
        composeRule.setContent { Screen(state = riverton, place = opened.value) }

        val producers: List<Pair<TownBuildingKind, String>> = listOf(
            TownBuildingKind.Farm to "Comida",
            TownBuildingKind.Factory to "Material",
            TownBuildingKind.PowerStation to "Energía",
        )
        val shown: List<TownBuildingKind> = producers
            .filter { (place: TownBuildingKind, stock: String) ->
                opened.value = place
                composeRule.waitForIdle()
                composeRule.onAllNodesWithText(stock).fetchSemanticsNodes().size == 1
            }
            .map { (place: TownBuildingKind, _) -> place }
        assertEquals(listOf(TownBuildingKind.Farm, TownBuildingKind.Factory, TownBuildingKind.PowerStation), shown)
    }

    @Test
    fun `shows every stock with its capacity on storage's page`() {
        show(riverton, place = TownBuildingKind.Storage)

        listOf("Dinero", "Comida", "Energía", "Material").forEach { stock: String ->
            composeRule.onNodeWithText(stock).performScrollTo().assertIsDisplayed()
        }
        composeRule.onAllNodesWithText("de 900").assertCountEquals(TownResourceKind.entries.size)
    }

    @Test
    fun `shows the people on homes' page`() {
        show(riverton, place = TownBuildingKind.Homes)

        composeRule.onNodeWithText("Gente: 24 libres, 96 trabajando").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows no stock on the school's page`() {
        show(riverton, place = TownBuildingKind.School)

        composeRule.onAllNodesWithText("de 900").assertCountEquals(0)
    }
}
