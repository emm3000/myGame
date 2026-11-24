package com.emm.mygame.feature.town.building

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownScreenFixtures
import com.emm.mygame.feature.town.TownUiState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlaceBuildingWorkScreenTest : TownScreenFixtures() {

    @Test
    fun `draws the build mark on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm, buildMark = summerBuild), TownBuildingKind.Farm))

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText(BUILD_MARK).assertExists()
    }

    @Test
    fun `draws no build mark on a page with no work`() {
        show(inWork(riverton.copy(slot = busyFarm, buildMark = summerBuild), TownBuildingKind.Farm))

        composeRule.onAllNodesWithText(BUILD_MARK).assertCountEquals(0)
    }

    @Test
    fun `draws the slot on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm))
        composeRule.onAllNodesWithContentDescription(STOP_FARM).assertCountEquals(0)

        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithContentDescription(STOP_FARM).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `stops the slot from the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm))
        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithContentDescription(STOP_FARM).performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.Farm, 2)), intents)
    }

    @Test
    fun `draws each waiting entry with its stop on its own place's page`() {
        val busy: TownUiState.Content = riverton.copy(slot = busyFarm, waitingList = listOf(waitingSchool))
        show(inWork(busy, TownBuildingKind.Farm, TownBuildingKind.School))

        composeRule.onNodeWithText("Lista de espera").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("Parar la obra: Escuela, nivel 2").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.School, 2)), intents)
    }

    @Test
    fun `brings a refused stop at the end of the page fully into view above the street`() {
        val waiting: TownUiState = inWork(riverton.copy(waitingList = listOf(waitingSchool)), TownBuildingKind.School)
        val shown: MutableState<TownUiState> = mutableStateOf(waiting)
        showState(shown, window = phoneWindow)

        shown.value = (shown.value as TownUiState.Content).copy(
            stop = StopStatus.Unreachable(WorkTarget(TownBuildingKind.School, 2)),
        )
        composeRule.waitForIdle()

        val refusal: DpRect = composeRule.onNodeWithText(UNEXPECTED).getUnclippedBoundsInRoot()
        val streetTop: Dp = composeRule.onNode(hasContentDescription(STREET)).getUnclippedBoundsInRoot().top
        assertTrue("refusal ends at ${refusal.bottom}, street starts at $streetTop", refusal.bottom <= streetTop)
    }
}
