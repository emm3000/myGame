package com.emm.mygame.feature.town

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.feature.town.building.PlaceBuildingWork
import com.emm.mygame.feature.town.building.PlaceStocks
import com.emm.mygame.feature.town.building.SeasonRow
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import com.emm.mygame.feature.town.hiring.HiringSection
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class TownCaptionFiguresTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val localRead: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 12, 11, 0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    @Test
    fun `sets tabular figures on the hired counts and never on their words`() {
        showHiring(TownUiState.HiringLine.Done(TownHireKind.Worker, count = 3, delivered = 1))

        assertEquals(listOf("1", "3"), composeRule.tabularRunsOf("de 3 contratados"))
    }

    @Test
    fun `sets tabular figures on a stock's capacity and never on its words`() {
        showStock(stockOf(TownResourceKind.Money, amount = 120, ratePerHour = 30.0, capacity = 12000, fullAt = null))

        assertEquals(listOf("12 000"), composeRule.tabularRunsOf("de 12"))
    }

    @Test
    fun `sets tabular figures on a full stock's capacity and never on its words`() {
        showStock(stockOf(TownResourceKind.Money, amount = 900, ratePerHour = 30.0, capacity = 900, fullAt = null))

        assertEquals(listOf("900"), composeRule.tabularRunsOf("Lleno: "))
    }

    @Test
    fun `sets tabular figures on a stock's rate and never on its words`() {
        showStock(stockOf(TownResourceKind.Money, amount = 120, ratePerHour = 30.0, capacity = 900, fullAt = null))

        assertEquals(listOf("30"), composeRule.tabularRunsOf(" / h"))
    }

    @Test
    fun `sets tabular figures on a stock's fill hour and never on its words`() {
        val fillingMoney: TownSnapshot.Stock = stockOf(
            TownResourceKind.Money,
            amount = 120,
            ratePerHour = 30.0,
            capacity = 900,
            fullAt = localRead + 8.hours,
        )

        showStock(fillingMoney)

        assertEquals(listOf("19:00"), composeRule.tabularRunsOf("Lleno 19"))
    }

    @Test
    fun `sets tabular figures on the season's time left and never on its words`() {
        showSeason(
            TownUiState.SeasonLine(SeasonKind.Winter, year = 2, remaining = 3.days, productionMarks = emptyList()),
        )

        assertEquals(listOf("3"), composeRule.tabularRunsOf("termina en"))
    }

    @Test
    fun `sets tabular figures on the work's level and never on its word`() {
        showWork(TownUiState.SlotLine.Done(TownBuildingKind.Farm, level = 2))

        assertEquals(listOf("2"), composeRule.tabularRunsOf("Nivel"))
    }

    private fun showHiring(order: TownUiState.HiringLine) {
        val hiring = TownUiState.Hiring(
            order = order,
            hires = emptyList(),
            hireMark = null,
            place = TownUiState.HiringStatus.Idle,
            stop = TownUiState.HiringStopStatus.Idle,
        )
        composeRule.setContent { MyGameTheme { HiringSection(hiring = hiring, onIntent = {}) } }
    }

    private fun showStock(money: TownSnapshot.Stock) {
        val content: TownUiState.Content = townOf(stocks = listOf(money), readAt = localRead).contentAt(
            now = localRead,
            gap = Duration.ZERO,
            requests = TownRequests.none,
            registered = TownRegistered.nothing,
            hireEntries = emptyMap(),
            closed = ClosedGuidance.none,
        )
        composeRule.setContent { MyGameTheme { PlaceStocks(place = TownBuildingKind.Storage, content = content) } }
    }

    private fun showWork(slot: TownUiState.SlotLine) {
        val content: TownUiState.Content = townOf(readAt = localRead).contentAt(
            now = localRead,
            gap = Duration.ZERO,
            requests = TownRequests.none,
            registered = TownRegistered.nothing,
            hireEntries = emptyMap(),
            closed = ClosedGuidance.none,
        ).copy(slot = slot)
        composeRule.setContent {
            MyGameTheme { PlaceBuildingWork(place = TownBuildingKind.Farm, content = content, onIntent = {}) }
        }
    }

    private fun showSeason(season: TownUiState.SeasonLine) {
        composeRule.setContent { MyGameTheme { SeasonRow(season = season) } }
    }
}
