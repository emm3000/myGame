package com.emm.mygame.feature.town.building.work

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.DurationMark
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownScreenFixture
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.readInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class PlaceBuildingWorkScreenTest : TownScreenFixture() {

    @Test
    fun `draws the build mark on the page of the place in work`() {
        show(
            inWork(riverton.copy(slot = busyFarm, buildMark = summerBuild), TownBuildingKind.Farm),
            place = TownBuildingKind.Farm,
        )

        composeRule.onNodeWithText(BUILD_MARK).assertExists()
    }

    @Test
    fun `draws no build mark on a page with no work`() {
        show(
            inWork(riverton.copy(slot = busyFarm, buildMark = summerBuild), TownBuildingKind.Farm),
            place = TownBuildingKind.School,
        )

        composeRule.onAllNodesWithText(BUILD_MARK).assertCountEquals(0)
    }

    @Test
    fun `draws the slot on the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm), place = TownBuildingKind.Farm)

        composeRule.onNodeWithContentDescription(STOP_FARM).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `stops the slot from the page of the place in work`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm), place = TownBuildingKind.Farm)

        composeRule.onNodeWithContentDescription(STOP_FARM).performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.Farm, 2)), intents)
    }

    @Test
    fun `draws each waiting entry with its stop on its own place's page`() {
        val busy: TownUiState.Content = riverton.copy(slot = busyFarm, waitingList = listOf(waitingSchool))
        show(inWork(busy, TownBuildingKind.Farm, TownBuildingKind.School), place = TownBuildingKind.School)

        composeRule.onNodeWithText("Lista de espera").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("Parar la obra: Escuela, nivel 2").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.StopTapped(TownBuildingKind.School, 2)), intents)
    }

    @Test
    fun `draws no slot on another place's page`() {
        show(inWork(riverton.copy(slot = busyFarm), TownBuildingKind.Farm), place = TownBuildingKind.School)

        composeRule.onAllNodesWithContentDescription(STOP_FARM).assertCountEquals(0)
    }

    @Test
    fun `brings a refused stop at the end of the page fully into view`() {
        val waiting: TownUiState = inWork(riverton.copy(waitingList = listOf(waitingSchool)), TownBuildingKind.School)
        val shown: MutableState<TownUiState> = mutableStateOf(waiting)
        showState(shown, window = phoneWindow, place = TownBuildingKind.School)

        shown.value = (shown.value as TownUiState.Content).copy(
            stop = StopStatus.Unreachable(WorkTarget(TownBuildingKind.School, 2)),
        )
        composeRule.waitForIdle()

        val refusal: DpRect = composeRule.onNodeWithText(UNEXPECTED).getUnclippedBoundsInRoot()
        assertTrue("refusal ends at ${refusal.bottom}", refusal.bottom <= phoneWindow.height)
    }

    private val waitingSchool: WaitingLine = WaitingLine(
        building = TownBuildingKind.School,
        level = 2,
        remaining = 20.minutes,
        finishesAt = readInstant,
    )

    private val summerBuild: DurationMark = DurationMark(SeasonKind.Summer, percent = 75)

    private companion object {
        const val BUILD_MARK: String = "Verano: las obras tardan el 75 % del tiempo"
        const val STOP_FARM: String = "Parar la obra: Granja, nivel 2"
    }
}
