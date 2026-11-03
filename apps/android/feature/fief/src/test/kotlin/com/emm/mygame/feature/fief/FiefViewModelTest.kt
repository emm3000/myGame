package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.UpgradeRefusal
import com.emm.mygame.core.network.UpgradeResult
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class FiefViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val readAt: Instant = firstReadAt

    @Test
    fun `reads the fief when the screen opens`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)

        viewModel.state.test {
            assertEquals(FiefUiState.Loading, awaitItem())
            fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle)))
            assertTrue(awaitItem() is FiefUiState.Content)
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `draws the amounts the api stored at the read`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(resources = listOf(wood(amount = 500, ratePerHour = 60.0)))))

        viewModel.state.test {
            val content: FiefUiState.Content = awaitContent()
            assertEquals("Vadoalto", content.name)
            assertEquals(
                FiefUiState.ResourceLine(ResourceKind.Wood, amount = 500, capacity = 1000, ratePerHour = 60),
                content.resources.single(),
            )
        }
    }

    @Test
    fun `draws the rate per hour as a whole number`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(resources = listOf(wood(amount = 300, ratePerHour = 18.75)))))

        viewModel.state.test {
            assertEquals(18L, awaitContent().resources.single().ratePerHour)
        }
    }

    @Test
    fun `draws the amounts accrued since the read after a minute`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(resources = listOf(wood(amount = 500, ratePerHour = 60.0)))))

        viewModel.state.test {
            assertEquals(500L, awaitContent().resources.single().amount)
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(501L, awaitContent().resources.single().amount)
        }
    }

    @Test
    fun `repaints the amounts at most once a minute`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(resources = listOf(wood(amount = 500, ratePerHour = 3600.0)))))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(59.seconds)
            runCurrent()
            expectNoEvents()
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(560L, awaitContent().resources.single().amount)
        }
    }

    @Test
    fun `caps the drawn wood at the warehouse capacity`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(fief(resources = listOf(wood(amount = 990, ratePerHour = 3600.0, capacity = 1000)))),
        )

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.minutes)
            runCurrent()
            val wood: FiefUiState.ResourceLine = awaitContent().resources.single()
            assertEquals(1000L, wood.amount)
            assertTrue(wood.isFull)
        }
    }

    @Test
    fun `freezes a stock above the capacity`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(fief(resources = listOf(wood(amount = 1200, ratePerHour = 3600.0, capacity = 1000)))),
        )

        viewModel.state.test {
            val wood: FiefUiState.ResourceLine = awaitContent().resources.single()
            assertEquals(1200L, wood.amount)
            assertTrue(wood.isFull)
            advanceTimeBy(5.minutes)
            runCurrent()
            expectNoEvents()
        }
    }

    @Test
    fun `draws an idle build slot`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle)))

        viewModel.state.test {
            assertEquals(FiefUiState.SlotLine.Idle, awaitContent().slot)
        }
    }

    @Test
    fun `draws a busy build slot with the time left`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.hours))))

        viewModel.state.test {
            assertEquals(
                FiefUiState.SlotLine.Busy(BuildingKind.Sawmill, targetLevel = 3, remaining = 2.hours),
                awaitContent().slot,
            )
        }
    }

    @Test
    fun `counts the build slot down once a minute until its last minute`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 3.minutes))))

        viewModel.state.test {
            assertEquals(3.minutes, awaitContent().remaining())
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(2.minutes, awaitContent().remaining())
        }
    }

    @Test
    fun `counts the build slot down every second in its last minute`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 90.seconds))))

        viewModel.state.test {
            assertEquals(90.seconds, awaitContent().remaining())
            advanceTimeBy(30.seconds)
            runCurrent()
            assertEquals(60.seconds, awaitContent().remaining())
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(59.seconds, awaitContent().remaining())
        }
    }

    @Test
    fun `re-reads the fief when the build slot finishes`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.seconds))))
        fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle, readAt = readAt + 2.seconds)))

        viewModel.state.test {
            assertEquals(2.seconds, awaitContent().remaining())
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(1.seconds, awaitContent().remaining())
            assertEquals(1, fiefs.readCount)
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(FiefUiState.SlotLine.Idle, awaitContent().slot)
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `restarts the projection from the answer of the re-read`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val finishedAt: Instant = readAt + 1.seconds
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(resources = listOf(wood(amount = 500, ratePerHour = 3600.0)), slot = busySlot(1.seconds)),
            ),
        )
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(resources = listOf(wood(amount = 100, ratePerHour = 3600.0)), readAt = finishedAt),
            ),
        )

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(100L, awaitContent().resources.single().amount)
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(160L, awaitContent().resources.single().amount)
        }
    }

    @Test
    fun `offers a retry when the api cannot be reached`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)

        viewModel.state.test {
            assertEquals(FiefUiState.Loading, awaitItem())
            fiefs.answerRead(FiefReadResult.Unreachable)
            assertEquals(FiefUiState.Failed, awaitItem())
        }
    }

    @Test
    fun `reads the fief again on retry`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Unreachable)

        viewModel.state.test {
            assertEquals(FiefUiState.Failed, awaitItem())
            fiefs.answerRead(FiefReadResult.Read(fief()))
            viewModel.onIntent(FiefIntent.RetryTapped)
            assertEquals(FiefUiState.Loading, awaitItem())
            assertTrue(awaitItem() is FiefUiState.Content)
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `keeps the last content and asks again when the re-read at the end of the build cannot reach the api`() =
        runTest {
            val fiefs: FakeFiefRepository = FakeFiefRepository()
            val viewModel: FiefViewModel = openFief(fiefs)
            fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 1.seconds))))
            fiefs.answerRead(FiefReadResult.Unreachable)
            fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle, readAt = readAt + 61.seconds)))

            viewModel.state.test {
                assertEquals(1.seconds, awaitContent().remaining())
                advanceTimeBy(1.seconds)
                runCurrent()
                assertEquals(Duration.ZERO, awaitContent().remaining())
                advanceTimeBy(1.minutes)
                runCurrent()
                assertEquals(FiefUiState.SlotLine.Idle, awaitContent().slot)
            }
            assertEquals(3, fiefs.readCount)
        }

    @Test
    fun `re-reads once when the api still answers the build busy`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 1.seconds))))
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    slot = BuildSlot.Busy(BuildingKind.Sawmill, targetLevel = 3, finishesAt = readAt + 2.minutes),
                    readAt = readAt + 1.seconds,
                ),
            ),
        )

        viewModel.state.test {
            assertEquals(1.seconds, awaitContent().remaining())
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(119.seconds, awaitContent().remaining())
            advanceTimeBy(59.seconds)
            runCurrent()
            assertEquals(60.seconds, awaitContent().remaining())
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `counts the build down on the server's time when the device clock is ahead`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs, deviceNow = readAt + 10.minutes)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 3.minutes))))

        viewModel.state.test {
            assertEquals(3.minutes, awaitContent().remaining())
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(2.minutes, awaitContent().remaining())
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `draws the amounts on the server's time when the device clock is behind`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs, deviceNow = readAt - 1.hours)
        fiefs.answerRead(FiefReadResult.Read(fief(resources = listOf(wood(amount = 500, ratePerHour = 60.0)))))

        viewModel.state.test {
            assertEquals(500L, awaitContent().resources.single().amount)
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(501L, awaitContent().resources.single().amount)
        }
    }

    @Test
    fun `draws each building with its level and the next level's cost, duration and peasants`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    resources = listOf(wood(amount = 500, ratePerHour = 0.0), iron(amount = 100)),
                    buildings = listOf(sawmill(level = 2)),
                ),
            ),
        )

        viewModel.state.test {
            assertEquals(
                FiefUiState.BuildingCard(
                    kind = BuildingKind.Sawmill,
                    level = 2,
                    next = FiefUiState.NextLevelLine(
                        level = 3,
                        costs = listOf(
                            FiefUiState.CostLine(ResourceKind.Wood, amount = 60, isShort = false),
                            FiefUiState.CostLine(ResourceKind.Iron, amount = 15, isShort = false),
                        ),
                        duration = 2.minutes,
                        peasants = 1,
                        isShortOfPeasants = false,
                    ),
                    block = null,
                ),
                awaitContent().buildings.single(),
            )
        }
    }

    @Test
    fun `offers no next level for a building at its highest level`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val topWarehouse: BuildingState = BuildingState(BuildingKind.Warehouse, level = 10, nextLevel = null)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(topWarehouse))))

        viewModel.state.test {
            assertEquals(null, awaitContent().buildings.single().next)
        }
    }

    @Test
    fun `draws the free peasants out of those supplied`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(peasants = Peasants(free = 5, supplied = 12, lowestFree = 5))))

        viewModel.state.test {
            assertEquals(FiefUiState.PeasantsLine(free = 5, supplied = 12), awaitContent().peasants)
        }
    }

    @Test
    fun `names the resources the next level lacks`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    resources = listOf(wood(amount = 500, ratePerHour = 0.0), iron(amount = 0)),
                    buildings = listOf(sawmill()),
                ),
            ),
        )

        viewModel.state.test {
            val card: FiefUiState.BuildingCard = awaitContent().buildings.single()
            val ironShort: FiefUiState.Shortfall = FiefUiState.Shortfall(ResourceKind.Iron, 15)
            assertEquals(FiefUiState.BlockReason.Resources(listOf(ironShort), ready = null), card.block)
            assertTrue(card.next?.costs?.single { it.kind == ResourceKind.Iron }?.isShort == true)
        }
    }

    @Test
    fun `names the peasants before the resources when both block`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    resources = listOf(wood(amount = 0, ratePerHour = 0.0)),
                    buildings = listOf(sawmill()),
                    peasants = Peasants(free = 0, supplied = 10, lowestFree = 0),
                ),
            ),
        )

        viewModel.state.test {
            assertEquals(
                FiefUiState.BlockReason.Peasants(needed = 1, free = 0),
                awaitContent().buildings.single().block,
            )
        }
    }

    @Test
    fun `names the queue before the resources when both block`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    resources = listOf(wood(amount = 0, ratePerHour = 0.0)),
                    slot = busySlot(finishesIn = 2.hours),
                    buildings = listOf(sawmill()),
                    peasants = Peasants(free = 0, supplied = 10, lowestFree = 0),
                    queue = BuildQueue(
                        entries = List(4) { index: Int -> waitingSawmill(index + 4, readAt + 3.hours) },
                        cap = 4,
                    ),
                ),
            ),
        )

        viewModel.state.test {
            assertEquals(FiefUiState.BlockReason.QueueFull, awaitContent().buildings.single().block)
        }
    }

    @Test
    fun `draws the overview the upgrade answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill()))))
        val busyFief: FiefSnapshot = fief(slot = busySlot(finishesIn = 2.minutes), buildings = listOf(sawmill()))
        fiefs.answerUpgrade(UpgradeResult.Upgraded(busyFief))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            val upgraded: FiefUiState.Content = awaitContentWhere { it.slot is FiefUiState.SlotLine.Busy }
            assertEquals(
                FiefUiState.SlotLine.Busy(BuildingKind.Sawmill, targetLevel = 3, remaining = 2.minutes),
                upgraded.slot,
            )
            assertEquals(FiefUiState.UpgradeStatus.Idle, upgraded.upgrade)
        }
        assertEquals(listOf(FiefId(FIEF_ID) to BuildingKind.Sawmill), fiefs.upgrades)
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `upgrades the barracks as any other building`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill(), barracks()))))
        val barracksUnderWay: BuildSlot =
            BuildSlot.Busy(BuildingKind.Barracks, targetLevel = 1, finishesAt = firstReadAt + 6.minutes)
        fiefs.answerUpgrade(
            UpgradeResult.Upgraded(fief(slot = barracksUnderWay, buildings = listOf(sawmill(), barracks()))),
        )

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Barracks))
            assertEquals(
                FiefUiState.SlotLine.Busy(BuildingKind.Barracks, targetLevel = 1, remaining = 6.minutes),
                awaitContentWhere { it.slot is FiefUiState.SlotLine.Busy }.slot,
            )
        }
        assertEquals(listOf(FiefId(FIEF_ID) to BuildingKind.Barracks), fiefs.upgrades)
    }

    @Test
    fun `waits on the api once while an upgrade is under way`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill()))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            assertEquals(FiefUiState.UpgradeStatus.Waiting(BuildingKind.Sawmill), awaitContent().upgrade)
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            runCurrent()
        }
        assertEquals(1, fiefs.upgrades.size)
    }

    @Test
    fun `sends the upgrade of a blocked building and lets the api decide`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(resources = listOf(wood(amount = 0, ratePerHour = 0.0)), buildings = listOf(sawmill())),
            ),
        )

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            runCurrent()
            cancelAndIgnoreRemainingEvents()
        }
        assertEquals(listOf(FiefId(FIEF_ID) to BuildingKind.Sawmill), fiefs.upgrades)
    }

    @Test
    fun `shows the refusal the api names`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill()))))
        fiefs.answerUpgrade(UpgradeResult.Refused(UpgradeRefusal.InsufficientResources))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            assertEquals(
                FiefUiState.UpgradeStatus.Refused(BuildingKind.Sawmill, UpgradeRefusal.InsufficientResources),
                awaitContentWhere { it.upgrade is FiefUiState.UpgradeStatus.Refused }.upgrade,
            )
        }
    }

    @Test
    fun `keeps the refusal while the amounts repaint`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill()))))
        fiefs.answerUpgrade(UpgradeResult.Refused(UpgradeRefusal.QueueFull))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            awaitContentWhere { it.upgrade is FiefUiState.UpgradeStatus.Refused }
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(
                FiefUiState.UpgradeStatus.Refused(BuildingKind.Sawmill, UpgradeRefusal.QueueFull),
                awaitContent().upgrade,
            )
        }
    }

    @Test
    fun `drops the refusal once the fief is read again`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.seconds), buildings = listOf(sawmill()))),
        )
        fiefs.answerUpgrade(UpgradeResult.Refused(UpgradeRefusal.QueueFull))
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill()), readAt = readAt + 2.seconds)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            awaitContentWhere { it.upgrade is FiefUiState.UpgradeStatus.Refused }
            advanceTimeBy(2.seconds)
            runCurrent()
            assertEquals(
                FiefUiState.UpgradeStatus.Idle,
                awaitContentWhere { it.slot == FiefUiState.SlotLine.Idle }.upgrade,
            )
        }
    }

    @Test
    fun `tells the lord the upgrade could not reach the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(sawmill()))))
        fiefs.answerUpgrade(UpgradeResult.Unreachable)

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            assertEquals(
                FiefUiState.UpgradeStatus.Unreachable(BuildingKind.Sawmill),
                awaitContentWhere { it.upgrade is FiefUiState.UpgradeStatus.Unreachable }.upgrade,
            )
        }
    }
}
