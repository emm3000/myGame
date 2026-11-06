package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.TownWorkRefusal
import com.emm.mygame.core.network.TownWorkResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class TownWorkViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `offers the next level with its cost and duration`() = runTest {
        val farm: TownSnapshot.Building = TownSnapshot.Building(
            TownBuildingKind.Farm,
            level = 1,
            next = nextLevelOf(
                level = 2,
                costs = listOf(TownSnapshot.Cost(TownResourceKind.Food, 50)),
                duration = 90.seconds,
                people = 3,
            ),
        )

        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf(farm)))

        assertEquals(
            TownUiState.PlaceCard(
                kind = TownBuildingKind.Farm,
                level = 1,
                isInWork = false,
                next = TownUiState.NextLevelLine(
                    level = 2,
                    costs = listOf(TownUiState.CostLine(TownResourceKind.Food, 50, isShort = false)),
                    duration = 90.seconds,
                    people = 3,
                ),
                block = null,
            ),
            placeOf(viewModel, TownBuildingKind.Farm),
        )
    }

    @Test
    fun `offers no level past the top`() = runTest {
        val office: TownSnapshot.Building = TownSnapshot.Building(TownBuildingKind.Office, level = 10, next = null)

        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf(office)))

        assertNull(placeOf(viewModel, TownBuildingKind.Office).next)
    }

    @Test
    fun `names the shortfall of a level the stocks cannot pay`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 40)),
                places = placesOf(costlyFarm(money = 60)),
            ),
        )

        assertEquals(
            TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Money, 20))),
            placeOf(viewModel, TownBuildingKind.Farm).block,
        )
    }

    @Test
    fun `marks the cost the stocks cannot pay as short`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 40)),
                places = placesOf(costlyFarm(money = 60)),
            ),
        )

        assertTrue(placeOf(viewModel, TownBuildingKind.Farm).next?.costs?.single()?.isShort == true)
    }

    @Test
    fun `lifts the shortfall once the projected stock can pay`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 59, ratePerHour = 60.0)),
                places = placesOf(costlyFarm(money = 60)),
            ),
        )

        advanceTimeBy(1.minutes)
        runCurrent()

        assertNull(placeOf(viewModel, TownBuildingKind.Farm).block)
    }

    @Test
    fun `names too few free people with an idle slot`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                people = TownSnapshot.People(supplied = 2, free = 2, atWork = 0),
                places = placesOf(TownSnapshot.Building(TownBuildingKind.Farm, 1, nextLevelOf(people = 5))),
            ),
        )

        assertEquals(
            TownUiState.BlockReason.PeopleShort(needed = 5, free = 2),
            placeOf(viewModel, TownBuildingKind.Farm).block,
        )
    }

    @Test
    fun `lets a level wait for people the work in the slot may free`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                people = TownSnapshot.People(supplied = 2, free = 2, atWork = 0),
                places = placesOf(TownSnapshot.Building(TownBuildingKind.Farm, 1, nextLevelOf(people = 5))),
                slot = workOf(TownBuildingKind.Homes),
            ),
        )

        assertNull(placeOf(viewModel, TownBuildingKind.Farm).block)
    }

    @Test
    fun `lets a level wait for people the waiting work may free`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                people = TownSnapshot.People(supplied = 2, free = 2, atWork = 0),
                places = placesOf(TownSnapshot.Building(TownBuildingKind.Farm, 1, nextLevelOf(people = 5))),
                waitingList = listOf(workOf(TownBuildingKind.Homes)),
            ),
        )

        assertNull(placeOf(viewModel, TownBuildingKind.Farm).block)
    }

    @Test
    fun `leaves the list open while the slot is empty`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(waitingList = listOf(workOf(), workOf()), cap = 2))

        assertNull(placeOf(viewModel, TownBuildingKind.Homes).block)
    }

    @Test
    fun `blocks every level while the list is full`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(), waitingList = listOf(workOf(), workOf()), cap = 2))

        assertEquals(TownUiState.BlockReason.WaitingListFull(cap = 2), placeOf(viewModel, TownBuildingKind.Homes).block)
    }

    @Test
    fun `starts work on the place the player chose`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Factory))

        assertEquals(listOf(TownBuildingKind.Factory), towns.starts)
    }

    @Test
    fun `asks the api even for a level the stocks cannot pay`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 0)),
                places = placesOf(costlyFarm(money = 60)),
            ),
        )

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(listOf(TownBuildingKind.Farm), towns.starts)
    }

    @Test
    fun `draws the start as waiting while the api answers`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(TownUiState.StartStatus.Waiting(TownBuildingKind.Farm), contentOf(viewModel).start)
    }

    @Test
    fun `starts work once on a double tap`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))
        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(1, towns.starts.size)
    }

    @Test
    fun `draws the town the start answered`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        towns.answerWork(TownWorkResult.Answered(townOf(slot = workOf(TownBuildingKind.Farm))))

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(TownBuildingKind.Farm, (contentOf(viewModel).slot as TownUiState.SlotLine.Busy).building)
    }

    @Test
    fun `returns the start to idle once answered`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        towns.answerWork(TownWorkResult.Answered(townOf()))

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(TownUiState.StartStatus.Idle, contentOf(viewModel).start)
    }

    @Test
    fun `keeps a refusal beside the place that asked`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        val refusal: TownWorkRefusal = TownWorkRefusal.WaitingListFull(cap = 2)
        towns.answerWork(TownWorkResult.Refused(refusal))

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(TownUiState.StartStatus.Refused(TownBuildingKind.Farm, refusal), contentOf(viewModel).start)
    }

    @Test
    fun `draws a failed start beside the place that asked`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        towns.answerWork(TownWorkResult.Unreachable)

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(TownUiState.StartStatus.Unreachable(TownBuildingKind.Farm), contentOf(viewModel).start)
    }

    @Test
    fun `clears a refusal at the next read`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))
        towns.answerWork(TownWorkResult.Refused(TownWorkRefusal.NotEnoughResources))
        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))
        towns.answerRead(TownReadResult.Read(townOf(readAt = readInstant + 1.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(TownUiState.StartStatus.Idle, contentOf(viewModel).start)
    }

    @Test
    fun `keeps a refusal through a repaint`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        val refusal: TownWorkRefusal = TownWorkRefusal.NotEnoughResources
        towns.answerWork(TownWorkResult.Refused(refusal))
        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        advanceTimeBy(2.minutes)
        runCurrent()

        assertEquals(TownUiState.StartStatus.Refused(TownBuildingKind.Farm, refusal), contentOf(viewModel).start)
    }

    @Test
    fun `stops work by its place and level`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)))

        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(listOf(FakeTownRepository.StopRequest(TownBuildingKind.Farm, 2)), towns.stops)
    }

    @Test
    fun `stops work once on a double tap`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)))

        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))
        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(1, towns.stops.size)
    }

    @Test
    fun `draws the stop as waiting while the api answers`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)))

        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(
            TownUiState.StopStatus.Waiting(TownUiState.WorkTarget(TownBuildingKind.Farm, 2)),
            contentOf(viewModel).stop,
        )
    }

    @Test
    fun `draws the refund the stop answered`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)))
        val refunded: TownSnapshot = townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 160)))
        towns.answerWork(TownWorkResult.Answered(refunded))

        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(160L, moneyOf(viewModel).amount)
    }

    @Test
    fun `keeps a refused stop beside its work`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)))
        val refusal: TownWorkRefusal = TownWorkRefusal.BuildingWorkNotFound(level = 2)
        towns.answerWork(TownWorkResult.Refused(refusal))

        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(
            TownUiState.StopStatus.Refused(TownUiState.WorkTarget(TownBuildingKind.Farm, 2), refusal),
            contentOf(viewModel).stop,
        )
    }

    @Test
    fun `draws a failed stop beside its work`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)))
        towns.answerWork(TownWorkResult.Unreachable)

        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(
            TownUiState.StopStatus.Unreachable(TownUiState.WorkTarget(TownBuildingKind.Farm, 2)),
            contentOf(viewModel).stop,
        )
    }

    @Test
    fun `keeps the clock gap of the last read after a mutation`() = runTest {
        val skewed: TownViewModel = homeViewModel(townOf(), start = readInstant - 3.hours)
        val rising: TownSnapshot = townOf(
            stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0)),
            readAt = readInstant - 1.minutes,
        )
        towns.answerWork(TownWorkResult.Answered(rising))

        skewed.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(101L, moneyOf(skewed).amount)
    }

    @Test
    fun `keeps the clock gap of the last read after a stop`() = runTest {
        val skewed: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2)), start = readInstant - 3.hours)
        val rising: TownSnapshot = townOf(
            stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0)),
            readAt = readInstant - 1.minutes,
        )
        towns.answerWork(TownWorkResult.Answered(rising))

        skewed.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))

        assertEquals(101L, moneyOf(skewed).amount)
    }

    @Test
    fun `projects nothing after an answer that lands on a hidden screen`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerWork(TownWorkResult.Answered(townOf(slot = workOf(lasting = 1.minutes))))
        runCurrent()

        advanceTimeBy(2.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `clears a stop refusal at the next read`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2, lasting = 1.minutes)))
        towns.answerWork(TownWorkResult.Refused(TownWorkRefusal.BuildingWorkNotFound(level = 2)))
        viewModel.onIntent(TownIntent.StopTapped(TownBuildingKind.Farm, level = 2))
        towns.answerRead(TownReadResult.Read(townOf(readAt = readInstant + 1.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(TownUiState.StopStatus.Idle, contentOf(viewModel).stop)
    }

    @Test
    fun `clears a refusal when the screen comes back`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        towns.answerWork(TownWorkResult.Refused(TownWorkRefusal.NotEnoughResources))
        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(townOf()))

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals(TownUiState.StartStatus.Idle, contentOf(viewModel).start)
    }

    @Test
    fun `lets a level take exactly the free people`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                people = TownSnapshot.People(supplied = 5, free = 5, atWork = 0),
                places = placesOf(TownSnapshot.Building(TownBuildingKind.Farm, 1, nextLevelOf(people = 5))),
            ),
        )

        assertNull(placeOf(viewModel, TownBuildingKind.Farm).block)
    }

    @Test
    fun `lets a stock pay exactly its cost`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 60)),
                places = placesOf(costlyFarm(money = 60)),
            ),
        )

        val farm: TownUiState.PlaceCard = placeOf(viewModel, TownBuildingKind.Farm)
        assertEquals(false to null, farm.next?.costs?.single()?.isShort to farm.block)
    }

    @Test
    fun `ignores a stale read answered after a mutation`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(name = "Riverton"))
        viewModel.onIntent(TownIntent.ScreenHidden)
        viewModel.onIntent(TownIntent.ScreenShown)
        towns.answerWork(TownWorkResult.Answered(townOf(name = "Answered")))
        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        towns.answerRead(TownReadResult.Read(townOf(name = "Stale")))
        runCurrent()

        assertEquals("Answered", contentOf(viewModel).name)
    }

    private fun costlyFarm(money: Long): TownSnapshot.Building = TownSnapshot.Building(
        TownBuildingKind.Farm,
        level = 1,
        next = nextLevelOf(costs = listOf(TownSnapshot.Cost(TownResourceKind.Money, money))),
    )

    private fun TestScope.homeViewModel(town: TownSnapshot, start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return viewModelOf(start)
    }

    private fun TestScope.viewModelOf(start: Instant = readInstant): TownViewModel =
        townViewModelOf(towns, start)
}
