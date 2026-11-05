package com.emm.mygame.feature.town

import app.cash.turbine.test
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeSessionRepository
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
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class TownViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    @Test
    fun `draws the loading state while the api reads the town`() = runTest {
        val viewModel: TownViewModel = viewModelOf()

        assertEquals(TownUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the failure when the town cannot be read`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)

        assertEquals(TownUiState.Failed, viewModelOf().state.value)
    }

    @Test
    fun `reads the town again on retry`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: TownViewModel = viewModelOf()
        towns.answerRead(TownReadResult.Read(townOf(name = "Riverton")))

        viewModel.onIntent(TownIntent.RetryTapped)

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `draws the four stocks in the order the api gave them`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        assertEquals(
            listOf(
                TownResourceKind.Money,
                TownResourceKind.Food,
                TownResourceKind.Power,
                TownResourceKind.Material,
            ),
            contentOf(viewModel).stocks.map { stock: TownUiState.StockLine -> stock.kind },
        )
    }

    @Test
    fun `draws the rate per hour as a whole number`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, ratePerHour = 30.9))))

        assertEquals(30L, moneyOf(viewModel).ratePerHour)
    }

    @Test
    fun `draws the people free and at work`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(people = TownSnapshot.People(supplied = 30, free = 24, atWork = 6)))

        assertEquals(TownUiState.PeopleLine(free = 24, atWork = 6), contentOf(viewModel).people)
    }

    @Test
    fun `draws the seven places`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        assertEquals(
            TownBuildingKind.entries.toList(),
            contentOf(viewModel).places.map { place: TownUiState.PlaceCard -> place.kind },
        )
    }

    @Test
    fun `labels a town the api calls a city`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(label = TownLabel.City))

        assertEquals(TownLabel.City, contentOf(viewModel).label)
    }

    @Test
    fun `projects each stock between reads up to storage`() = runTest {
        val rising: TownSnapshot = townOf(
            stocks = stocksOf(
                stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0, capacity = 1000),
                stockOf(TownResourceKind.Food, amount = 995, ratePerHour = 600.0, capacity = 1000),
            ),
        )
        val viewModel: TownViewModel = homeViewModel(rising)

        advanceTimeBy(2.minutes)
        runCurrent()

        assertEquals(
            listOf(102L, 1000L),
            contentOf(viewModel).stocks.take(2).map { stock: TownUiState.StockLine -> stock.amount },
        )
    }

    @Test
    fun `marks a stock full at its capacity`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 1000, capacity = 1000))))

        assertTrue(moneyOf(viewModel).isFull)
    }

    @Test
    fun `projects from the server's clock on a skewed device`() = runTest {
        val rising: TownSnapshot =
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0)))
        val viewModel: TownViewModel = homeViewModel(rising, start = readInstant - 3.hours)

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(101L, moneyOf(viewModel).amount)
    }

    @Test
    fun `draws an idle slot when no work runs`() = runTest {
        assertEquals(TownUiState.SlotLine.Idle, contentOf(homeViewModel(townOf())).slot)
    }

    @Test
    fun `counts the slot down to its finish`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, level = 2, startsAt = readInstant - 5.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(
            TownUiState.SlotLine.Busy(
                building = TownBuildingKind.Farm,
                level = 2,
                remaining = 4.minutes,
                total = 10.minutes,
                finishesAt = readInstant + 5.minutes,
            ),
            contentOf(viewModel).slot,
        )
    }

    @Test
    fun `repaints each second in the last minute of the slot`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 90.seconds)))

        advanceTimeBy(32.seconds)
        runCurrent()

        assertEquals(58.seconds, (contentOf(viewModel).slot as TownUiState.SlotLine.Busy).remaining)
    }

    @Test
    fun `draws the waiting list with its countdowns`() = runTest {
        val waiting: TownSnapshot.WorkItem = workOf(TownBuildingKind.School, level = 3, lasting = 20.minutes)

        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(), waitingList = listOf(waiting)))

        assertEquals(
            listOf(
                TownUiState.WaitingLine(
                    building = TownBuildingKind.School,
                    level = 3,
                    remaining = 20.minutes,
                    finishesAt = readInstant + 20.minutes,
                ),
            ),
            contentOf(viewModel).waitingList,
        )
    }

    @Test
    fun `gives the finish on the device's clock`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(lasting = 10.minutes)), start = readInstant - 3.hours)

        assertEquals(
            readInstant - 3.hours + 10.minutes,
            (contentOf(viewModel).slot as TownUiState.SlotLine.Busy).finishesAt,
        )
    }

    @Test
    fun `tells the slot is done until the next read answers`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2, lasting = 1.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(TownUiState.SlotLine.Done(TownBuildingKind.Farm, level = 2), contentOf(viewModel).slot)
    }

    @Test
    fun `reads the town when the slot finishes`() = runTest {
        homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `shows a finished level after the next read`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2, lasting = 1.minutes)))
        val finished: TownSnapshot.Building = TownSnapshot.Building(TownBuildingKind.Farm, level = 2, next = null)
        towns.answerRead(TownReadResult.Read(townOf(places = placesOf(finished), readAt = readInstant + 1.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(2, placeOf(viewModel, TownBuildingKind.Farm).level)
    }

    @Test
    fun `tries the read again when the finished work could not be read`() = runTest {
        homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))
        towns.answerRead(TownReadResult.Unreachable)

        advanceTimeBy(1.minutes)
        runCurrent()
        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(3, towns.readCount)
    }

    @Test
    fun `reads the town when the lesson finishes`() = runTest {
        homeViewModel(townOf(lessonFinishesAt = readInstant + 1.minutes))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads the town when the season ends`() = runTest {
        homeViewModel(townOf(seasonEndsAt = readInstant + 1.minutes))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads nothing while nothing finishes`() = runTest {
        homeViewModel(townOf(seasonEndsAt = readInstant + 5.hours))

        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `asks for a name when a read finds the town gone`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))
        towns.answerRead(TownReadResult.NoTown)

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(TownUiState.Naming("", TownUiState.NamingStatus.Idle), viewModel.state.value)
    }

    @Test
    fun `stops reading while the screen is hidden`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))

        viewModel.onIntent(TownIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `reads the town again when the screen comes back`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(name = "Riverton"))
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(townOf(name = "Lakeside")))

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals("Lakeside", contentOf(viewModel).name)
    }

    @Test
    fun `keeps the last town when the screen comes back to a failed read`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(name = "Riverton"))
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Unreachable)

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `reads again on return when the first read was cut off`() = runTest {
        val viewModel: TownViewModel = viewModelOf()
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(townOf(name = "Riverton")))

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `opens the home of a town founded while the screen was hidden`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        viewModel.onIntent(TownIntent.NameSubmitted)
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerFound(TownFoundResult.Founded(townOf(name = "Riverton")))
        runCurrent()
        towns.answerRead(TownReadResult.Read(townOf(name = "Riverton")))

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `signs out and tells the route`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        sessions.answerSignOut()

        viewModel.effects.test {
            viewModel.onIntent(TownIntent.SignOutTapped)

            assertEquals(TownEffect.SignedOut, awaitItem())
        }
    }

    @Test
    fun `draws signing out while the session ends`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.SignOutTapped)

        assertEquals(TownUiState.SigningOut, viewModel.state.value)
    }

    @Test
    fun `ignores every tap while signing out`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        viewModel.onIntent(TownIntent.SignOutTapped)

        viewModel.onIntent(TownIntent.BuildTapped(TownBuildingKind.Farm))

        assertEquals(emptyList<TownBuildingKind>(), towns.starts)
    }

    private fun TestScope.namingViewModel(start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.NoTown)
        return viewModelOf(start)
    }

    private fun TestScope.homeViewModel(town: TownSnapshot, start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return viewModelOf(start)
    }

    private fun TestScope.viewModelOf(start: Instant = readInstant): TownViewModel =
        townViewModelOf(towns, sessions, start)
}
