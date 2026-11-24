package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.naming.NamingStatus
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

class TownRereadViewModelTest : TownViewModelFixture() {

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
    fun `tries a failed read once a minute while a waiting work counts down its last minute`() = runTest {
        homeViewModel(
            townOf(
                slot = workOf(lasting = 1.minutes),
                waitingList = listOf(workOf(startsAt = readInstant + 1.minutes, lasting = 2.minutes)),
            ),
        )
        repeat(OUTAGE_READS) { towns.answerRead(TownReadResult.Unreachable) }

        advanceTimeBy(3.minutes)
        runCurrent()

        assertEquals(4, towns.readCount)
    }

    @Test
    fun `reads at the next finish once a retried read succeeds`() = runTest {
        homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))
        towns.answerRead(TownReadResult.Unreachable)
        towns.answerRead(
            TownReadResult.Read(
                townOf(
                    slot = workOf(startsAt = readInstant + 2.minutes, lasting = 5.minutes),
                    readAt = readInstant + 2.minutes,
                ),
            ),
        )
        advanceTimeBy(2.minutes)
        runCurrent()

        advanceTimeBy(5.minutes - 1.seconds)
        runCurrent()
        val readsBeforeTheFinish: Int = towns.readCount
        advanceTimeBy(1.seconds)
        runCurrent()

        assertEquals(listOf(3, 4), listOf(readsBeforeTheFinish, towns.readCount))
    }

    @Test
    fun `reads the town when the lesson finishes`() = runTest {
        homeViewModel(townOf(lessonSlot = lessonEndingAt(readInstant + 1.minutes)))

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
    fun `reads the town at nextDueAt`() = runTest {
        homeViewModel(townOf(nextDueAt = readInstant + 5.minutes))

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `re-reads once at nextDueAt when the device clock runs ahead`() = runTest {
        val aheadOfTheServer: Instant = readInstant + 2.hours
        val dueAt: Instant = readInstant + 5.minutes
        homeViewModel(townOf(nextDueAt = dueAt), start = aheadOfTheServer)
        towns.answerRead(TownReadResult.Read(townOf(nextDueAt = dueAt + 1.hours, readAt = dueAt)))

        advanceTimeBy(4.minutes)
        runCurrent()
        assertEquals(1, towns.readCount)

        advanceTimeBy(1.minutes)
        runCurrent()
        assertEquals(2, towns.readCount)

        advanceTimeBy(59.minutes)
        runCurrent()
        assertEquals(2, towns.readCount)
    }

    @Test
    fun `keeps the wait for nextDueAt on the server's clock when the read still names it`() = runTest {
        val dueAt: Instant = readInstant + 5.minutes
        homeViewModel(townOf(nextDueAt = dueAt), start = readInstant + 2.hours)
        towns.answerRead(TownReadResult.Read(townOf(nextDueAt = dueAt, readAt = dueAt - 1.minutes)))

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `ignores a nextDueAt already past in the answer of a read`() = runTest {
        homeViewModel(townOf(nextDueAt = readInstant - 1.minutes))

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
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

        assertEquals(TownUiState.Naming("", NamingStatus.Idle), viewModel.state.value)
    }

    @Test
    fun `measures the clock gap again at the read of a finished work`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))
        towns.answerRead(TownReadResult.Read(risingTownReadAt(readInstant + 1.minutes + 3.hours)))
        advanceTimeBy(1.minutes)
        runCurrent()

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(101L, moneyOf(viewModel).amount)
    }
}
