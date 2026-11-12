package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownReadyLineScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val localReady: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 6, 9, 30).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    private val farmOffer: TownUiState.PlaceCard = TownUiState.PlaceCard(
        kind = TownBuildingKind.Farm,
        level = 1,
        raisedFrom = null,
        isInWork = false,
        next = TownUiState.NextLevelLine(
            level = 2,
            costs = listOf(TownUiState.CostLine(TownResourceKind.Food, 150, isShort = true)),
            duration = 90.seconds,
            people = 3,
        ),
        block = null,
    )

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = listOf(
            TownUiState.StockLine(TownResourceKind.Food, 130, capacity = 900, ratePerHour = 30, skillLevel = 0),
        ),
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        season = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = listOf(farmOffer),
        nextStep = caughtUpCard,
        nextStepTime = null,
        goal = null,
        tip = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        office = idleOffice,
    )

    @Test
    fun `names the minute the resources arrive under an hour`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 24.minutes, readyAt = localReady)))

        composeRule.onNodeWithText("Lista en 24 min").assertIsDisplayed()
    }

    @Test
    fun `names a ready time under a minute as one minute`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 42.seconds, readyAt = localReady)))

        composeRule.onNodeWithText("Lista en 1 min").assertIsDisplayed()
    }

    @Test
    fun `names the clock the resources arrive at from an hour on`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 1.hours, readyAt = localReady)))

        composeRule.onNodeWithText("Lista 09:30").assertIsDisplayed()
    }

    @Test
    fun `names tomorrow when the resources arrive past midnight`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 12.hours, readyAt = localReady)))

        composeRule.onNodeWithText("Lista mañana 09:30").assertIsDisplayed()
    }

    @Test
    fun `draws no ready line when the resources never arrive`() {
        show(shortOfFoodUntil(ready = null))

        composeRule.onNodeWithText("Lista", substring = true).assertDoesNotExist()
    }

    private fun shortOfFoodUntil(ready: TownUiState.ReadyTime?): TownUiState.BlockReason =
        TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Food, 20)), ready = ready)

    private fun show(block: TownUiState.BlockReason) {
        composeRule.setContent {
            MyGameTheme {
                PlacesSection(
                    content = riverton.copy(places = listOf(farmOffer.copy(block = block))),
                    onIntent = {},
                    onSchoolOpen = {},
                )
            }
        }
    }
}
