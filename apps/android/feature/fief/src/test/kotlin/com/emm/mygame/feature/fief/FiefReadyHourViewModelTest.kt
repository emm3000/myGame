package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.NextLevel
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.testing.FakeFiefRepository
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
import org.junit.Rule
import org.junit.Test

class FiefReadyHourViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val readAt: Instant = Instant.parse("2026-09-22T12:00:00Z")

    @Test
    fun `reads lista with the clock when only resources are short`() = runTest {
        val block: FiefUiState.BlockReason? = ironMineBlockOf(ironMineShortOfIron(ironAmount = 30))

        assertEquals(
            FiefUiState.BlockReason.Resources(
                shortfalls = listOf(FiefUiState.Shortfall(ResourceKind.Iron, 30)),
                ready = FiefUiState.ReadyHour.AtClock(
                    readyAt = Instant.parse("2026-09-22T18:00:00Z"),
                    remaining = 6.hours,
                ),
            ),
            block,
        )
    }

    @Test
    fun `reads lista with the time left when the ready hour is within the hour`() = runTest {
        val block: FiefUiState.BlockReason? = ironMineBlockOf(ironMineShortOfIron(ironAmount = 56))

        assertEquals(FiefUiState.ReadyHour.InMinutes(48), (block as FiefUiState.BlockReason.Resources).ready)
    }

    @Test
    fun `reads the later ready hour of two short resources`() = runTest {
        val shortOfIron: FiefSnapshot = ironMineShortOfIron(ironAmount = 30)
        val shortOfWoodAndIron: FiefSnapshot = shortOfIron.copy(
            resources = shortOfIron.resources.map { resource: StoredResource ->
                if (resource.kind == ResourceKind.Wood) resource.copy(amount = 150, ratePerHour = 5.0) else resource
            },
        )

        val block: FiefUiState.BlockReason? = ironMineBlockOf(shortOfWoodAndIron)

        assertEquals(
            FiefUiState.BlockReason.Resources(
                shortfalls = listOf(
                    FiefUiState.Shortfall(ResourceKind.Wood, 50),
                    FiefUiState.Shortfall(ResourceKind.Iron, 30),
                ),
                ready = FiefUiState.ReadyHour.AtClock(
                    readyAt = Instant.parse("2026-09-22T22:00:00Z"),
                    remaining = 10.hours,
                ),
            ),
            block,
        )
    }

    @Test
    fun `reads lista en 1 h when the ready hour is exactly an hour away`() = runTest {
        val block: FiefUiState.BlockReason? = ironMineBlockOf(ironMineShortOfIron(ironAmount = 55))

        assertEquals(FiefUiState.ReadyHour.InAnHour, (block as FiefUiState.BlockReason.Resources).ready)
    }

    @Test
    fun `reads lista en 1 min when the ready hour is less than a minute away`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs, deviceNow = readAt)
        val repaintingEverySecond: FiefSnapshot = ironMineShortOfIron(ironAmount = 56).copy(
            slot = BuildSlot.Busy(BuildingKind.Sawmill, targetLevel = 1, finishesAt = readAt + 47.minutes + 45.seconds),
        )
        fiefs.answerRead(FiefReadResult.Read(repaintingEverySecond))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(47.minutes + 30.seconds)
            runCurrent()
            val content: FiefUiState.Content = expectMostRecentItem() as FiefUiState.Content
            val block: FiefUiState.BlockReason? =
                content.buildings.single { card: FiefUiState.BuildingCard -> card.kind == BuildingKind.IronMine }.block
            assertEquals(FiefUiState.ReadyHour.InMinutes(1), (block as FiefUiState.BlockReason.Resources).ready)
        }
    }

    @Test
    fun `reads no lista when peasants are short too`() = runTest {
        val nobodyFree: FiefSnapshot =
            ironMineShortOfIron(ironAmount = 30).copy(peasants = Peasants(free = 0, supplied = 12, lowestFree = 0))

        assertEquals(FiefUiState.BlockReason.Peasants(needed = 1, free = 0), ironMineBlockOf(nobodyFree))
    }

    @Test
    fun `reads no lista when the cost exceeds the capacity`() = runTest {
        val ironStoreTooSmall: FiefSnapshot = ironMineShortOfIron(ironAmount = 30, ironCapacity = 50)

        assertEquals(
            FiefUiState.BlockReason.Resources(listOf(FiefUiState.Shortfall(ResourceKind.Iron, 30)), ready = null),
            ironMineBlockOf(ironStoreTooSmall),
        )
    }

    @Test
    fun `reads no lista when a short resource does not accrue`() = runTest {
        val noIronComing: FiefSnapshot = ironMineShortOfIron(ironAmount = 30, ironRatePerHour = 0.0)

        assertEquals(
            FiefUiState.BlockReason.Resources(listOf(FiefUiState.Shortfall(ResourceKind.Iron, 30)), ready = null),
            ironMineBlockOf(noIronComing),
        )
    }

    @Test
    fun `reads lista at the next whole minute when the ready instant falls between minutes`() = runTest {
        val readBetweenMinutes: FiefSnapshot = ironMineShortOfIron(ironAmount = 30).copy(readAt = readAt + 40.seconds)

        val block: FiefUiState.BlockReason? = ironMineBlockOf(readBetweenMinutes, deviceNow = readAt + 40.seconds)

        assertEquals(
            FiefUiState.ReadyHour.AtClock(
                readyAt = Instant.parse("2026-09-22T18:01:00Z"),
                remaining = 6.hours + 20.seconds,
            ),
            (block as FiefUiState.BlockReason.Resources).ready,
        )
    }

    @Test
    fun `reads lista a minute later when the accrual falls just short of the cost at the computed minute`() =
        runTest {
            val slowIron: FiefSnapshot = ironMineShortOfIron(ironAmount = 1, ironCost = 36, ironRatePerHour = 1.4)

            val block: FiefUiState.BlockReason? = ironMineBlockOf(slowIron)

            assertEquals(
                FiefUiState.ReadyHour.AtClock(
                    readyAt = Instant.parse("2026-09-23T13:01:00Z"),
                    remaining = 25.hours + 1.minutes,
                ),
                (block as FiefUiState.BlockReason.Resources).ready,
            )
        }

    @Test
    fun `reads lista on the device clock when it runs behind the server`() = runTest {
        val block: FiefUiState.BlockReason? =
            ironMineBlockOf(ironMineShortOfIron(ironAmount = 30), deviceNow = readAt - 10.minutes)

        assertEquals(
            FiefUiState.ReadyHour.AtClock(readyAt = Instant.parse("2026-09-22T17:50:00Z"), remaining = 6.hours),
            (block as FiefUiState.BlockReason.Resources).ready,
        )
    }

    private suspend fun TestScope.ironMineBlockOf(
        snapshot: FiefSnapshot,
        deviceNow: Instant = readAt,
    ): FiefUiState.BlockReason? {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs, deviceNow = deviceNow)
        fiefs.answerRead(FiefReadResult.Read(snapshot))
        var block: FiefUiState.BlockReason? = null
        viewModel.state.test {
            block = awaitContent().buildings.single { card: FiefUiState.BuildingCard ->
                card.kind == BuildingKind.IronMine
            }.block
        }
        return block
    }

    private fun ironMineShortOfIron(
        ironAmount: Long,
        ironCost: Long = 60,
        ironRatePerHour: Double = 5.0,
        ironCapacity: Long = 1000,
    ): FiefSnapshot = fief(
        readAt = readAt,
        resources = listOf(
            wood(amount = 900, ratePerHour = 40.0),
            StoredResource(ResourceKind.Stone, amount = 900, ratePerHour = 30.0, capacity = 1000),
            StoredResource(
                ResourceKind.Iron,
                amount = ironAmount,
                ratePerHour = ironRatePerHour,
                capacity = ironCapacity,
            ),
        ),
        buildings = listOf(
            BuildingState(
                kind = BuildingKind.IronMine,
                level = 0,
                nextLevel = NextLevel(
                    level = 1,
                    cost = listOf(
                        ResourceCost(ResourceKind.Wood, 200),
                        ResourceCost(ResourceKind.Stone, 120),
                        ResourceCost(ResourceKind.Iron, ironCost),
                    ),
                    duration = 20.minutes,
                    peasants = 1,
                ),
            ),
        ),
    )
}
