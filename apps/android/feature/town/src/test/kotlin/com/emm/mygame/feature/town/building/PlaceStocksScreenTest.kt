package com.emm.mygame.feature.town.building

import androidx.compose.foundation.layout.size
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.feature.town.TownScreenFixture
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlaceStocksScreenTest : TownScreenFixture() {

    @Test
    fun `shows each producer's stock on its own page`() {
        show(riverton)

        val producers: List<Pair<String, String>> =
            listOf("Granja" to "Comida", "Fábrica" to "Material", "Central eléctrica" to "Energía")
        val shown: List<String> = producers
            .filter { (place: String, stock: String) ->
                tab(place).performScrollTo().performClick()
                composeRule.onAllNodesWithText(stock).fetchSemanticsNodes().size == 1
            }
            .map { (place: String, _) -> place }
        assertEquals(listOf("Granja", "Fábrica", "Central eléctrica"), shown)
    }

    @Test
    fun `shows every stock with its capacity on storage's page`() {
        show(riverton)

        tab("Almacén").performScrollTo().performClick()

        listOf("Dinero", "Comida", "Energía", "Material").forEach { stock: String ->
            composeRule.onNodeWithText(stock).performScrollTo().assertIsDisplayed()
        }
        composeRule.onAllNodesWithText("de 900").assertCountEquals(TownResourceKind.entries.size)
    }

    @Test
    fun `shows the people on homes' page`() {
        show(riverton)

        tab("Hogares").performScrollTo().performClick()

        composeRule.onNodeWithText("Gente: 24 libres, 96 trabajando").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows no stock on the school's page`() {
        show(riverton)

        composeRule.onAllNodesWithText("de 900").assertCountEquals(0)
    }
}
