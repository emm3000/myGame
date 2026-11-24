package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.building.TownBuildingKind
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownStreetTabsScreenTest : TownScreenFixtures() {

    @Test
    fun `each place is a tab named by its place and level`() {
        show(riverton.copy(places = street.leveled(TownBuildingKind.Farm, level = 4)))

        composeRule
            .onNode(isTab and hasContentDescription("Granja, Nivel 4"))
            .assertExists()
    }

    @Test
    fun `lays the places out in the street's order`() {
        show(riverton)

        val tabs: List<String> = composeRule
            .onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab))
            .fetchSemanticsNodes()
            .map { node -> node.config[SemanticsProperties.ContentDescription].single().substringBefore(",") }
        assertEquals(
            listOf("Hogares", "Granja", "Escuela", "Oficina", "Fábrica", "Central eléctrica", "Almacén"),
            tabs,
        )
    }

    @Test
    fun `adds the next step to its place's tab name`() {
        show(riverton)

        composeRule.onNode(hasContentDescription("Escuela, Nivel 1, tu siguiente paso")).assertExists()
    }

    @Test
    fun `adds the work to the tab name of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm))

        composeRule.onNode(hasContentDescription("Granja, Nivel 1, en construcción")).assertExists()
    }

    @Test
    fun `names the street with its built count`() {
        show(riverton.copy(places = street.leveled(TownBuildingKind.Office, level = 0)))

        composeRule.onNode(hasContentDescription("Tu pueblo: 6 de 7 construidos")).assertExists()
    }

    @Test
    fun `opens a place's page from its tab`() {
        show(riverton)

        tab("Almacén").performScrollTo().performClick()

        tab("Almacén").assertIsSelected()
        composeRule.onNodeWithText("Edificio 7 de 7").assertIsDisplayed()
    }
}
