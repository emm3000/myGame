package com.emm.mygame.feature.town.guidance

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
import com.emm.mygame.feature.town.TownScreenFixture
import com.emm.mygame.feature.town.TownUiState
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlaceGuidanceScreenTest : TownScreenFixture() {

    @Test
    fun `draws the goal's state on the goal building's page`() {
        show(riverton.copy(goal = factoryGoal), place = TownBuildingKind.Factory)

        composeRule.onNodeWithText("En construcción").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws no goal on another building's page`() {
        show(riverton.copy(goal = factoryGoal), place = TownBuildingKind.Farm)

        composeRule.onAllNodesWithText("Cerrar la meta").assertCountEquals(0)
    }

    @Test
    fun `closes the goal from the goal building's page`() {
        show(riverton.copy(goal = factoryGoal), place = TownBuildingKind.Factory)

        composeRule.onNodeWithText("Cerrar la meta").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.GoalClosed), intents)
    }

    @Test
    fun `draws each tip on the page of the place it talks about`() {
        val pages: Map<TipKind, TownBuildingKind> = mapOf(
            TipKind.Seasons to TownBuildingKind.Storage,
            TipKind.FullStore to TownBuildingKind.Storage,
            TipKind.People to TownBuildingKind.Homes,
            TipKind.Office to TownBuildingKind.Office,
            TipKind.Jobs to TownBuildingKind.Office,
        )
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        val opened: MutableState<TownBuildingKind?> = mutableStateOf(null)
        composeRule.setContent { Screen(state = shown.value, place = opened.value) }

        val found: Map<TipKind, TownBuildingKind?> = pages.mapValues { (tip: TipKind, page: TownBuildingKind) ->
            shown.value = riverton.copy(tip = tip)
            opened.value = page
            composeRule.waitForIdle()
            composeRule.onAllNodesWithText("Cerrar el consejo").fetchSemanticsNodes().size.let { count: Int ->
                if (count == 1) page else null
            }
        }
        assertEquals(pages, found)
    }

    @Test
    fun `draws the waiting list tip on the page of the place in work`() {
        show(
            inWork(riverton.copy(slot = busyFarm, tip = TipKind.WaitingList), TownBuildingKind.Farm),
            place = TownBuildingKind.Farm,
        )

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws no waiting list tip on a page with no work`() {
        show(
            inWork(riverton.copy(slot = busyFarm, tip = TipKind.WaitingList), TownBuildingKind.Farm),
            place = TownBuildingKind.School,
        )

        composeRule.onAllNodesWithText("Cerrar el consejo").assertCountEquals(0)
    }

    @Test
    fun `closes the tip it shows`() {
        show(riverton.copy(tip = TipKind.People), place = TownBuildingKind.Homes)

        composeRule.onNodeWithText("Cerrar el consejo").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.TipClosed(TipKind.People)), intents)
    }
}
