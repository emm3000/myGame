package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownBuildingKind
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

    private val farmLevelTwo: TownUiState.NextLevelLine = TownUiState.NextLevelLine(
        level = 2,
        costs = listOf(TownUiState.CostLine(TownResourceKind.Food, 150, isShort = true)),
        duration = 90.seconds,
        people = 3,
        wordsNeeded = null,
    )

    @Test
    fun `names the minute the resources arrive under an hour`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 24.minutes, readyAt = localReady)))

        composeRule.onNodeWithText("Lista en 24 min").assertIsDisplayed()
    }

    @Test
    fun `names the minutes and seconds left under a minute`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 30.seconds, readyAt = localReady)))

        composeRule.onNodeWithText("Lista en 0:30").assertIsDisplayed()
    }

    @Test
    fun `names the whole minutes left under an hour without the seconds`() {
        show(shortOfFoodUntil(TownUiState.ReadyTime(remaining = 30.minutes + 30.seconds, readyAt = localReady)))

        composeRule.onNodeWithText("Lista en 30 min").assertIsDisplayed()
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
                NextLevel(
                    building = TownBuildingKind.Farm,
                    next = farmLevelTwo,
                    block = block,
                    isWaiting = false,
                    onIntent = {},
                )
            }
        }
    }
}
