package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefOrdersViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val camp: MarchCamp = MarchCamp(tier = 2, strength = 15)

    private val cargo: List<ResourceQuantity> = listOf(ResourceQuantity(ResourceKind.Wood, 300))

    @Test
    fun `heads an attack on the way to its camp with the attack's heading and the camp`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(attack(arrivesIn = 5.minutes))

        assertEquals(
            FiefUiState.MarchHeading.AttackOutbound to FiefUiState.MarchDetail.Camp(camp),
            busy.heading to busy.detail,
        )
    }

    @Test
    fun `heads an attack coming back with the attack's return heading`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(attack(arrivesIn = (-1).minutes).copy(isFought = true))

        assertEquals(FiefUiState.MarchHeading.AttackReturning, busy.heading)
    }

    @Test
    fun `heads a recalled attack with the plain phase heading and no camp`() = runTest {
        val recalled: AwayMarch = attack(arrivesIn = 5.minutes).let { it.copy(recalledAt = it.departedAt + 1.minutes) }

        val busy: FiefUiState.MarchSlotLine.Busy = drawn(recalled)

        assertEquals(FiefUiState.MarchHeading.Outbound to null, busy.heading to busy.detail)
    }

    @Test
    fun `heads a founding on the way with the founding heading and the new fief's name`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(founding())

        assertEquals(
            FiefUiState.MarchHeading.FoundingOutbound to FiefUiState.MarchDetail.NewFief("Vega"),
            busy.heading to busy.detail,
        )
    }

    @Test
    fun `counts a founding on the way down to its arrival`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(founding())

        assertEquals(FiefUiState.MarchCountdown.Arrival to 5.minutes, busy.countdown to busy.remaining)
    }

    @Test
    fun `heads a recalled founding with the plain phase heading, no name and its return`() = runTest {
        val recalled: AwayMarch = founding().let {
            it.copy(
                arrivesAt = firstReadAt,
                leavesAt = firstReadAt,
                returnsAt = firstReadAt + 4.minutes,
                recalledAt = firstReadAt,
            )
        }

        val busy: FiefUiState.MarchSlotLine.Busy = drawn(recalled)

        assertEquals(
            listOf(FiefUiState.MarchHeading.Returning, null, FiefUiState.MarchCountdown.Return),
            listOf(busy.heading, busy.detail, busy.countdown),
        )
    }

    @Test
    fun `heads a transport on the way with the transport's heading and its cargo`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(transport(arrivesIn = 5.minutes))

        assertEquals(
            FiefUiState.MarchHeading.TransportOutbound to FiefUiState.MarchDetail.Cargo(cargo),
            busy.heading to busy.detail,
        )
    }

    @Test
    fun `counts a transport on the way down to its arrival, not its return`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(transport(arrivesIn = 5.minutes))

        assertEquals(FiefUiState.MarchCountdown.Arrival to 5.minutes, busy.countdown to busy.remaining)
    }

    @Test
    fun `heads a transport coming back with the transport's return heading and no cargo`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(transport(arrivesIn = (-1).minutes))

        assertEquals(
            listOf(FiefUiState.MarchHeading.TransportReturning, null, FiefUiState.MarchCountdown.Return),
            listOf(busy.heading, busy.detail, busy.countdown),
        )
    }

    @Test
    fun `keeps a recalled transport's cargo on its way back`() = runTest {
        val recalled: AwayMarch = transport(arrivesIn = (-1).minutes).let { it.copy(recalledAt = it.departedAt) }

        assertEquals(FiefUiState.MarchDetail.Cargo(cargo), drawn(recalled).detail)
    }

    @Test
    fun `draws no loot on a transport`() = runTest {
        val busy: FiefUiState.MarchSlotLine.Busy = drawn(transport(arrivesIn = 5.minutes))

        assertEquals(emptyList<ResourceQuantity>(), busy.loot)
    }

    @Test
    fun `offers the recall on an attack, a founding and a transport on the way`() = runTest {
        val onTheWay: List<AwayMarch> =
            listOf(attack(arrivesIn = 5.minutes), founding(), transport(arrivesIn = 5.minutes))

        val recallable: List<Boolean> = onTheWay.map { drawn(it).isRecallable }

        assertEquals(listOf(true, true, true), recallable)
    }

    @Test
    fun `re-reads the fief at an attack's battle`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(attack(arrivesIn = 5.minutes))))
        fiefs.answerRead(FiefReadResult.Read(marching(attack(arrivesIn = 0.minutes).copy(isFought = true))))

        viewModel.state.test {
            awaitContent()
            awaitContentWhere { busyOf(it).heading == FiefUiState.MarchHeading.AttackReturning }
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `reads no battle again for an attack already fought`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(attack(arrivesIn = (-1).minutes).copy(isFought = true))))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(3.minutes)
            cancelAndIgnoreRemainingEvents()
        }
        assertEquals(1, fiefs.readCount)
    }

    private suspend fun TestScope.drawn(march: AwayMarch): FiefUiState.MarchSlotLine.Busy {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(march)))
        var busy: FiefUiState.MarchSlotLine.Busy? = null
        viewModel.state.test {
            busy = busyOf(awaitContent())
            cancelAndIgnoreRemainingEvents()
        }
        return requireNotNull(busy)
    }

    private fun attack(arrivesIn: Duration): AwayMarch =
        forageOfInfantry(count = 12, arrivesIn = arrivesIn, foragesFor = 0.minutes, order = MarchOrder.Attack)
            .copy(camp = camp, loot = emptyList())

    private fun founding(): AwayMarch =
        forageOfInfantry(count = 0, arrivesIn = 5.minutes, foragesFor = 0.minutes, order = MarchOrder.Found)
            .copy(foundingName = "Vega", loot = emptyList())

    private fun transport(arrivesIn: Duration): AwayMarch =
        forageOfInfantry(count = 4, arrivesIn = arrivesIn, foragesFor = 0.minutes, order = MarchOrder.Transport)
            .copy(cargo = cargo, loot = emptyList())

    private fun busyOf(content: FiefUiState.Content): FiefUiState.MarchSlotLine.Busy =
        content.army?.march as FiefUiState.MarchSlotLine.Busy

    private fun marching(march: AwayMarch): FiefSnapshot = fief(
        buildings = listOf(barracks(level = 1)),
        units = army(infantryAtHome = 4, infantryAway = march.units.first().count),
        march = march,
    )
}
