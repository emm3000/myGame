package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

class TownReadyMinuteViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val risingMoney: List<TownSnapshot.Stock> =
        stocksOf(stockOf(TownResourceKind.Money, amount = 40, ratePerHour = 60.0))

    private val costlyFarm: TownSnapshot.Building = TownSnapshot.Building(
        TownBuildingKind.Farm,
        level = 1,
        next = nextLevelOf(costs = listOf(TownSnapshot.Cost(TownResourceKind.Money, 60)), people = 3),
    )

    private val shortFarmReason: TownUiState.BlockReason.Resources = TownUiState.BlockReason.Resources(
        shortfalls = listOf(TownUiState.Shortfall(TownResourceKind.Money, 20)),
        ready = TownUiState.ReadyTime(remaining = 20.minutes, readyAt = readInstant + 20.minutes),
    )

    @Test
    fun `names the ready minute when only resources are short`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(stocks = risingMoney, places = placesOf(costlyFarm)))

        assertEquals(shortFarmReason, placeOf(viewModel, TownBuildingKind.Farm).block)
    }

    @Test
    fun `names no ready minute when people are short too`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                stocks = risingMoney,
                people = TownSnapshot.People(supplied = 2, free = 2, atWork = 0),
                places = placesOf(costlyFarm),
            ),
        )

        assertEquals(
            TownUiState.BlockReason.PeopleShort(needed = 3, free = 2),
            placeOf(viewModel, TownBuildingKind.Farm).block,
        )
    }

    @Test
    fun `counts the ready minute down on the repaint without a read`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(stocks = risingMoney, places = placesOf(costlyFarm)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(
            TownUiState.ReadyTime(remaining = 19.minutes, readyAt = readInstant + 20.minutes),
            (placeOf(viewModel, TownBuildingKind.Farm).block as TownUiState.BlockReason.Resources).ready,
        )
        assertEquals(1, towns.readCount)
    }

    @Test
    fun `counts a place's last minute before its ready minute down every second`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(stocks = risingMoney, places = placesOf(costlyFarm)))

        advanceTimeBy(19.minutes + 1.seconds)
        runCurrent()
        val first: TownUiState.ReadyTime? = placeReadyOf(viewModel)
        advanceTimeBy(1.seconds)
        runCurrent()

        assertEquals(59.seconds, first?.remaining)
        assertEquals(58.seconds, placeReadyOf(viewModel)?.remaining)
    }

    @Test
    fun `counts a hire's last minute before its ready minute down every second`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0))),
        )
        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "3"))

        advanceTimeBy(19.minutes + 1.seconds)
        runCurrent()
        val first: TownUiState.ReadyTime? = hireReadyOf(viewModel)
        advanceTimeBy(1.seconds)
        runCurrent()

        assertEquals(59.seconds, first?.remaining)
        assertEquals(58.seconds, hireReadyOf(viewModel)?.remaining)
    }

    @Test
    fun `dates the ready minute on the device clock`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(stocks = risingMoney, places = placesOf(costlyFarm)),
            start = readInstant - 5.minutes,
        )

        assertEquals(
            TownUiState.ReadyTime(remaining = 20.minutes, readyAt = readInstant + 15.minutes),
            (placeOf(viewModel, TownBuildingKind.Farm).block as TownUiState.BlockReason.Resources).ready,
        )
    }

    @Test
    fun `names the ready minute of hires when only resources are short`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0))),
        )

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "3"))

        assertEquals(
            TownUiState.HireBlock.Resources(
                shortfalls = listOf(TownUiState.Shortfall(TownResourceKind.Money, 20)),
                ready = TownUiState.ReadyTime(remaining = 20.minutes, readyAt = readInstant + 20.minutes),
            ),
            formOf(viewModel).block,
        )
    }

    private fun placeReadyOf(viewModel: TownViewModel): TownUiState.ReadyTime? =
        (placeOf(viewModel, TownBuildingKind.Farm).block as? TownUiState.BlockReason.Resources)?.ready

    private fun hireReadyOf(viewModel: TownViewModel): TownUiState.ReadyTime? =
        (formOf(viewModel).block as? TownUiState.HireBlock.Resources)?.ready

    private fun formOf(viewModel: TownViewModel): TownUiState.HireForm = requireNotNull(
        contentOf(viewModel).office.hires.first { card: TownUiState.HireCard -> card.kind == TownHireKind.Worker }.form,
    )

    private fun TestScope.homeViewModel(town: TownSnapshot, start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return townViewModelOf(towns, start)
    }
}
