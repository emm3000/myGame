package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownStreetScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val levelTwo: TownUiState.NextLevelLine = TownUiState.NextLevelLine(
        level = 2,
        costs = listOf(TownUiState.CostLine(TownResourceKind.Money, 150, isShort = false)),
        duration = 90.seconds,
        people = 3,
        wordsNeeded = null,
    )

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
            TownUiState.StockLine(kind, 120, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = null)
        },
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        words = TownUiState.WordsLine(stable = 3, retained = 1),
        season = null,
        buildMark = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = streetOrder.map { kind: TownBuildingKind ->
            TownUiState.PlaceCard(kind, level = 1, raisedFrom = null, isInWork = false, next = levelTwo, block = null)
        },
        nextStepPlace = TownBuildingKind.School,
        goal = null,
        caughtUpGoal = null,
        tip = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        office = idleOffice,
    )

    @Test
    fun `names a city's street as the city's`() {
        show(mutableStateOf(riverton.copy(label = TownLabel.City)))

        composeRule.onNode(hasContentDescription("Tu ciudad: 7 de 7 construidos")).assertExists()
    }

    @Test
    fun `swiping back to a page that still holds a refusal leaves its scroll where it was`() {
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        show(shown)
        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performClick()
        shown.value = riverton.copy(
            start = TownUiState.StartStatus.Refused(TownBuildingKind.School, TownWorkRefusal.NotEnoughResources),
        )
        composeRule.waitForIdle()
        composeRule.onNodeWithText(TITLE).performScrollTo()
        val titleTop: Dp = composeRule.onNodeWithText(TITLE).getUnclippedBoundsInRoot().top

        tab("Almacén").performScrollTo().performClick()
        composeRule.waitForIdle()
        tab("Escuela").performScrollTo().performClick()
        composeRule.waitForIdle()

        assertEquals(titleTop, composeRule.onNodeWithText(TITLE).getUnclippedBoundsInRoot().top)
    }

    private fun tab(place: String): SemanticsNodeInteraction = composeRule.onNode(
        isTab and hasContentDescription(place, substring = true),
    )

    private fun show(shown: MutableState<TownUiState>) {
        composeRule.setContent {
            Box(modifier = Modifier.size(phoneWindow)) {
                MyGameTheme {
                    TownScreen(
                        state = shown.value,
                        onIntent = {},
                        onSchoolOpen = {},
                        onMapOpen = {},
                        ring = {},
                        status = {},
                        placement = {},
                    )
                }
            }
        }
    }

    private companion object {
        const val TITLE: String = "Riverton · Pueblo"
        val phoneWindow: DpSize = DpSize(360.dp, 640.dp)
    }
}
