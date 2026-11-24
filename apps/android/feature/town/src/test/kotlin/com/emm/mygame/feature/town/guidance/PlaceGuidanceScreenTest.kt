package com.emm.mygame.feature.town.guidance

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownScreenFixtures
import com.emm.mygame.feature.town.TownUiState
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlaceGuidanceScreenTest : TownScreenFixtures() {

    @Test
    fun `draws the goal's state on the goal building's page`() {
        show(riverton.copy(goal = factoryGoal, nextStepPlace = TownBuildingKind.Factory))

        composeRule.onNodeWithText("En construcción").performScrollTo().assertIsDisplayed()
        tab("Granja").performScrollTo().performClick()
        composeRule.onAllNodesWithText("Cerrar la meta").assertCountEquals(0)
    }

    @Test
    fun `closes the goal from the goal building's page`() {
        show(riverton.copy(goal = factoryGoal, nextStepPlace = TownBuildingKind.Factory))

        composeRule.onNodeWithText("Cerrar la meta").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.GoalClosed), intents)
    }

    @Test
    fun `draws each tip on the page of the place it talks about`() {
        val pages: Map<TipKind, String> = mapOf(
            TipKind.Seasons to "Almacén",
            TipKind.FullStore to "Almacén",
            TipKind.People to "Hogares",
            TipKind.Office to "Oficina",
            TipKind.Jobs to "Oficina",
        )
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        showState(shown)

        val found: Map<TipKind, String> = pages.mapValues { (tip: TipKind, page: String) ->
            shown.value = riverton.copy(tip = tip)
            tab(page).performScrollTo().performClick()
            composeRule.onAllNodesWithText("Cerrar el consejo").fetchSemanticsNodes().size.let { count: Int ->
                if (count == 1) page else "none"
            }
        }
        assertEquals(pages, found)
    }

    @Test
    fun `draws the waiting list tip on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm, tip = TipKind.WaitingList), TownBuildingKind.Farm))
        composeRule.onAllNodesWithText("Cerrar el consejo").assertCountEquals(0)

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `closes the tip it shows`() {
        show(riverton.copy(tip = TipKind.People, nextStepPlace = TownBuildingKind.Homes))

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.TipClosed(TipKind.People)), intents)
    }
}
