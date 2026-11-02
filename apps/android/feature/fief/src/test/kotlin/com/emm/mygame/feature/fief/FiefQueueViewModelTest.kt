package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.CancelRefusal
import com.emm.mygame.core.network.CancelResult
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.WaitingUpgrade
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.cancel
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefQueueViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val readAt: Instant = firstReadAt

    @Test
    fun `lists every waiting upgrade in order with its finish`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val twoWaiting: BuildQueue = BuildQueue(
            entries = listOf(
                waitingSawmill(targetLevel = 4, finishesAt = readAt + 30.minutes),
                WaitingUpgrade(BuildingKind.Farm, targetLevel = 2, finishesAt = readAt + 80.minutes),
            ),
            cap = 4,
        )
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 10.minutes), queue = twoWaiting)))

        viewModel.state.test {
            assertEquals(
                listOf(
                    FiefUiState.WaitingLine(BuildingKind.Sawmill, 4, 30.minutes, finishesAt = readAt + 30.minutes),
                    FiefUiState.WaitingLine(BuildingKind.Farm, 2, 80.minutes, finishesAt = readAt + 80.minutes),
                ),
                awaitContent().queue,
            )
        }
    }

    @Test
    fun `dates each waiting finish on the device clock when the device clock is ahead`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs, deviceNow = readAt + 10.minutes)
        val oneWaiting: BuildQueue = BuildQueue(listOf(waitingSawmill(4, finishesAt = readAt + 30.minutes)), cap = 4)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 10.minutes), queue = oneWaiting)))

        viewModel.state.test {
            val waiting: FiefUiState.WaitingLine = awaitContent().queue.single()
            assertEquals(30.minutes, waiting.remaining)
            assertEquals(readAt + 40.minutes, waiting.finishesAt)
        }
    }

    @Test
    fun `starts the next waiting upgrade on the re-read`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val nextFinish: Instant = readAt + 1.seconds + 5.minutes
        val oneWaiting: BuildQueue = BuildQueue(listOf(waitingSawmill(4, finishesAt = nextFinish)), cap = 4)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 1.seconds), queue = oneWaiting)))
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    slot = BuildSlot.Busy(BuildingKind.Sawmill, targetLevel = 4, finishesAt = nextFinish),
                    readAt = readAt + 1.seconds,
                ),
            ),
        )

        viewModel.state.test {
            assertEquals(1, awaitContent().queue.size)
            advanceTimeBy(1.seconds)
            runCurrent()
            val started: FiefUiState.Content = awaitContentWhere { it.queue.isEmpty() }
            assertEquals(
                FiefUiState.SlotLine.Busy(BuildingKind.Sawmill, targetLevel = 4, remaining = 5.minutes),
                started.slot,
            )
        }
    }

    @Test
    fun `cancels the upgrade naming its building and level`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.minutes))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
            runCurrent()
            cancelAndIgnoreRemainingEvents()
        }
        assertEquals(listOf(FakeFiefRepository.CancelRequest(FiefId(FIEF_ID), BuildingKind.Sawmill, 3)), fiefs.cancels)
    }

    @Test
    fun `draws the overview the cancel answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.minutes))))
        fiefs.answerCancel(CancelResult.Cancelled(fief(slot = BuildSlot.Idle)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
            val cancelled: FiefUiState.Content = awaitContentWhere { it.slot == FiefUiState.SlotLine.Idle }
            assertEquals(FiefUiState.CancelStatus.Idle, cancelled.cancel)
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `waits on the api once while a cancel is under way`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.minutes))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
            assertEquals(
                FiefUiState.CancelStatus.Waiting(FiefUiState.UpgradeTarget(BuildingKind.Sawmill, 3)),
                awaitContent().cancel,
            )
            viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
            runCurrent()
        }
        assertEquals(1, fiefs.cancels.size)
    }

    @Test
    fun `re-reads the fief when the cancel names a finished upgrade`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.minutes))))
        fiefs.answerCancel(CancelResult.Refused(CancelRefusal.UpgradeNotFound))
        fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
            val reread: FiefUiState.Content = awaitContentWhere { it.slot == FiefUiState.SlotLine.Idle }
            assertEquals(FiefUiState.CancelStatus.Idle, reread.cancel)
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `tells the lord the cancel could not reach the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.minutes))))
        fiefs.answerCancel(CancelResult.Unreachable)

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
            assertEquals(
                FiefUiState.CancelStatus.Unreachable(FiefUiState.UpgradeTarget(BuildingKind.Sawmill, 3)),
                awaitContentWhere { it.cancel is FiefUiState.CancelStatus.Unreachable }.cancel,
            )
        }
    }

    @Test
    fun `tells the lord the cancel could not reach the api when the re-read after a finished upgrade fails`() =
        runTest {
            val fiefs: FakeFiefRepository = FakeFiefRepository()
            val viewModel: FiefViewModel = openFief(fiefs)
            fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.minutes))))
            fiefs.answerCancel(CancelResult.Refused(CancelRefusal.UpgradeNotFound))
            fiefs.answerRead(FiefReadResult.Unreachable)

            viewModel.state.test {
                awaitContent()
                viewModel.onIntent(FiefIntent.CancelTapped(BuildingKind.Sawmill, targetLevel = 3))
                assertEquals(
                    FiefUiState.CancelStatus.Unreachable(FiefUiState.UpgradeTarget(BuildingKind.Sawmill, 3)),
                    awaitContentWhere { it.cancel is FiefUiState.CancelStatus.Unreachable }.cancel,
                )
            }
        }
}
