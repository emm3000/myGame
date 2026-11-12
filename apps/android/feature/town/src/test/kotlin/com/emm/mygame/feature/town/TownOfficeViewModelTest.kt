package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownHiringResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class TownOfficeViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val workerOrder: TownSnapshot.HiringOrder = TownSnapshot.HiringOrder(
        hire = TownHireKind.Worker,
        count = 3,
        delivered = 1,
        secondsPerHire = 60,
        startedAt = readInstant,
        endsAt = readInstant + 3.minutes,
    )

    private val hiringTown: TownSnapshot = townOf(hiring = hiringOf(order = workerOrder))

    private val workerTarget: TownUiState.HiringTarget = TownUiState.HiringTarget(TownHireKind.Worker, readInstant)

    @Test
    fun `hires workers from the office`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "3"))
        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))

        assertEquals(listOf(FakeTownRepository.HiringRequest(TownHireKind.Worker, 3)), towns.hirings)
    }

    @Test
    fun `locks trucks below office level 3`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf(placeAt(TownBuildingKind.Office, 2))))

        assertNull(hireOf(viewModel, TownHireKind.Truck).form)
    }

    @Test
    fun `opens trucks at office level 3`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf(placeAt(TownBuildingKind.Office, 3))))

        assertNotNull(hireOf(viewModel, TownHireKind.Truck).form)
    }

    @Test
    fun `names the office level each kind needs`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        assertEquals(3, hireOf(viewModel, TownHireKind.Truck).requiredOfficeLevel)
    }

    @Test
    fun `counts the hires the town holds per kind`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(hiring = hiringOf(workers = 4, trucks = 2)))

        assertEquals(listOf(4, 2), contentOf(viewModel).office.hires.map { card: TownUiState.HireCard -> card.team })
    }

    @Test
    fun `costs the count times each hire's cost`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "2"))

        assertEquals(
            listOf(TownUiState.CostLine(TownResourceKind.Money, 80, isShort = false)),
            offerOf(viewModel, TownHireKind.Worker).costs,
        )
    }

    @Test
    fun `times the order at the count times each hire's duration`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "5"))

        assertEquals(5.minutes, offerOf(viewModel, TownHireKind.Worker).duration)
    }

    @Test
    fun `asks for a count of one or more`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "0"))

        assertEquals(TownUiState.HireBlock.CountNeeded, formOf(viewModel, TownHireKind.Worker).block)
    }

    @Test
    fun `sends no order without a count`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "two"))
        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))

        assertEquals(emptyList<FakeTownRepository.HiringRequest>(), towns.hirings)
    }

    @Test
    fun `blocks a hire while an order runs`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)

        assertEquals(TownUiState.HireBlock.Busy, formOf(viewModel, TownHireKind.Worker).block)
    }

    @Test
    fun `disables the count field while an order runs`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)

        assertEquals(true, formOf(viewModel, TownHireKind.Worker).isEntryDisabled)
    }

    @Test
    fun `opens the count field while no order runs`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        assertEquals(false, formOf(viewModel, TownHireKind.Worker).isEntryDisabled)
    }

    @Test
    fun `names too few free people for the hires`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(people = TownSnapshot.People(10, free = 2, atWork = 8)))

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "3"))

        assertEquals(
            TownUiState.HireBlock.PeopleShort(needed = 3, free = 2),
            formOf(viewModel, TownHireKind.Worker).block,
        )
    }

    @Test
    fun `lets hires wait for people the building work may free`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(people = TownSnapshot.People(10, free = 1, atWork = 9), slot = workOf()),
        )

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "2"))

        assertNull(formOf(viewModel, TownHireKind.Worker).block)
    }

    @Test
    fun `names the shortfall of the hires`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100))),
        )

        viewModel.onIntent(TownIntent.HireEntryChanged(TownHireKind.Worker, "3"))

        assertEquals(
            TownUiState.HireBlock.Resources(listOf(TownUiState.Shortfall(TownResourceKind.Money, 20))),
            formOf(viewModel, TownHireKind.Worker).block,
        )
    }

    @Test
    fun `asks the api even for hires the stocks cannot pay`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 0))),
        )

        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))

        assertEquals(listOf(FakeTownRepository.HiringRequest(TownHireKind.Worker, 1)), towns.hirings)
    }

    @Test
    fun `places an order once on a double tap`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))
        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))

        assertEquals(1, towns.hirings.size)
    }

    @Test
    fun `draws only the kind being placed as waiting`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))

        assertEquals(TownUiState.HireStatus.Waiting(TownHireKind.Worker), contentOf(viewModel).office.place)
    }

    @Test
    fun `keeps a hiring refusal beside the kind that asked`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        towns.answerHiring(TownHiringResult.Refused(TownHiringRefusal.HiringSlotBusy))

        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Truck))

        assertEquals(
            TownUiState.HireStatus.Refused(TownHireKind.Truck, TownHiringRefusal.HiringSlotBusy),
            contentOf(viewModel).office.place,
        )
    }

    @Test
    fun `draws the town the order answered`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        towns.answerHiring(TownHiringResult.Answered(hiringTown))

        viewModel.onIntent(TownIntent.HireTapped(TownHireKind.Worker))

        assertEquals(workerTarget, (contentOf(viewModel).office.hiring as TownUiState.HiringLine.Busy).target)
    }

    @Test
    fun `shows each delivered hire after the next read`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)
        advanceTimeBy(150.seconds)
        runCurrent()
        towns.answerRead(TownReadResult.Read(townOf(hiring = hiringOf(order = workerOrder.copy(delivered = 2)))))

        viewModel.onIntent(TownIntent.ScreenHidden)
        viewModel.onIntent(TownIntent.ScreenShown)
        runCurrent()

        assertEquals(2, (contentOf(viewModel).office.hiring as TownUiState.HiringLine.Busy).delivered)
    }

    @Test
    fun `never counts a delivered hire on the device`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)

        advanceTimeBy(150.seconds)
        runCurrent()

        assertEquals(1, (contentOf(viewModel).office.hiring as TownUiState.HiringLine.Busy).delivered)
    }

    @Test
    fun `reads the town again when the order ends`() = runTest {
        homeViewModel(hiringTown)
        towns.answerRead(TownReadResult.Read(townOf()))

        advanceTimeBy(3.minutes + 1.seconds)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `stops the order by its kind and start`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)

        viewModel.onIntent(TownIntent.StopHiringTapped(workerTarget))

        assertEquals(listOf(FakeTownRepository.HiringStopRequest(TownHireKind.Worker, readInstant)), towns.hiringStops)
    }

    @Test
    fun `stops an order once on a double tap`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)

        viewModel.onIntent(TownIntent.StopHiringTapped(workerTarget))
        viewModel.onIntent(TownIntent.StopHiringTapped(workerTarget))

        assertEquals(1, towns.hiringStops.size)
    }

    @Test
    fun `keeps a stop refusal beside the order`() = runTest {
        val viewModel: TownViewModel = homeViewModel(hiringTown)
        towns.answerHiring(TownHiringResult.Refused(TownHiringRefusal.HiringOrderNotFound))

        viewModel.onIntent(TownIntent.StopHiringTapped(workerTarget))

        assertEquals(
            TownUiState.HireStopStatus.Refused(TownHiringRefusal.HiringOrderNotFound),
            contentOf(viewModel).office.stop,
        )
    }

    private fun hireOf(viewModel: TownViewModel, kind: TownHireKind): TownUiState.HireCard =
        contentOf(viewModel).office.hires.first { card: TownUiState.HireCard -> card.kind == kind }

    private fun formOf(viewModel: TownViewModel, kind: TownHireKind): TownUiState.HireForm =
        requireNotNull(hireOf(viewModel, kind).form)

    private fun offerOf(viewModel: TownViewModel, kind: TownHireKind): TownUiState.HireOffer =
        requireNotNull(formOf(viewModel, kind).offer)

    private fun TestScope.homeViewModel(town: TownSnapshot, start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return townViewModelOf(towns, start)
    }
}
