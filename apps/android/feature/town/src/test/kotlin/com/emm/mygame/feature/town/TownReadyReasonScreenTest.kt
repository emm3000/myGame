package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.building.BlockReason
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.NextLevel
import com.emm.mygame.feature.town.building.NextLevelLine
import com.emm.mygame.feature.town.building.Shortfall
import com.emm.mygame.feature.town.building.StartStatus
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

private const val SHORT_OF_FOOD: String = "Necesitas 20 de comida más."

@RunWith(RobolectricTestRunner::class)
class TownReadyReasonScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val localReady: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 6, 9, 30).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    private val farmLevelTwo: NextLevelLine = NextLevelLine(
        level = 2,
        costs = listOf(CostLine(TownResourceKind.Food, 150, isShort = true)),
        duration = 90.seconds,
        people = 3,
        wordsNeeded = null,
    )

    @Test
    fun `names the minute the resources arrive under an hour`() {
        show(shortOfFoodUntil(ReadyTime(remaining = 24.minutes, readyAt = localReady)))

        reasonEnding(words = "Lista en", time = "24 min")
    }

    @Test
    fun `names the minutes and seconds left under a minute`() {
        show(shortOfFoodUntil(ReadyTime(remaining = 30.seconds, readyAt = localReady)))

        reasonEnding(words = "Lista en", time = "0:30")
    }

    @Test
    fun `names the whole minutes left under an hour without the seconds`() {
        show(shortOfFoodUntil(ReadyTime(remaining = 30.minutes + 30.seconds, readyAt = localReady)))

        reasonEnding(words = "Lista en", time = "30 min")
    }

    @Test
    fun `names the clock the resources arrive at from an hour on`() {
        show(shortOfFoodUntil(ReadyTime(remaining = 1.hours, readyAt = localReady)))

        reasonEnding(words = "Lista", time = "09:30")
    }

    @Test
    fun `names tomorrow when the resources arrive past midnight`() {
        show(shortOfFoodUntil(ReadyTime(remaining = 12.hours, readyAt = localReady)))

        reasonEnding(words = "Lista", time = "mañana 09:30")
    }

    @Test
    fun `names no ready time when the resources never arrive`() {
        show(shortOfFoodUntil(ready = null))

        composeRule.onNodeWithText("Lista", substring = true, useUnmergedTree = true).assertDoesNotExist()
    }

    private fun reasonEnding(words: String, time: String) {
        composeRule
            .onNodeWithText("$SHORT_OF_FOOD $words $time", useUnmergedTree = true)
            .assertIsDisplayed()
    }

    private fun shortOfFoodUntil(ready: ReadyTime?): BlockReason =
        BlockReason.Resources(listOf(Shortfall(TownResourceKind.Food, 20)), ready = ready)

    private fun show(block: BlockReason) {
        composeRule.setContent {
            MyGameTheme {
                NextLevel(
                    building = TownBuildingKind.Farm,
                    next = farmLevelTwo,
                    block = block,
                    start = StartStatus.Idle,
                    onIntent = {},
                )
            }
        }
    }
}
