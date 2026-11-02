package com.emm.mygame.feature.fief

import androidx.lifecycle.viewModelScope
import app.cash.turbine.ReceiveTurbine
import app.cash.turbine.test
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
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

    private val readAt: Instant = Instant.fromEpochMilliseconds(1_000_000)

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
    fun `offers a retry when the re-read at the end of the build cannot reach the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 1.seconds))))
        fiefs.answerRead(FiefReadResult.Unreachable)

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(FiefUiState.Failed, awaitItem())
        }
    }

    private fun TestScope.openFief(fiefs: FakeFiefRepository): FiefViewModel {
        val viewModel: FiefViewModel = FiefViewModel(fiefs, TestClock(testScheduler, readAt))
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.viewModelScope.cancel()
            }
        }
        return viewModel
    }

    private suspend fun ReceiveTurbine<FiefUiState>.awaitContent(): FiefUiState.Content {
        var item: FiefUiState = awaitItem()
        while (item !is FiefUiState.Content) item = awaitItem()
        return item
    }

    private fun FiefUiState.Content.remaining(): Duration = (slot as FiefUiState.SlotLine.Busy).remaining

    private fun busySlot(finishesIn: Duration): BuildSlot =
        BuildSlot.Busy(BuildingKind.Sawmill, targetLevel = 3, finishesAt = readAt + finishesIn)

    private fun fief(
        resources: List<StoredResource> = listOf(wood(amount = 500, ratePerHour = 60.0)),
        slot: BuildSlot = BuildSlot.Idle,
        readAt: Instant = this.readAt,
    ): FiefSnapshot = FiefSnapshot(name = "Vadoalto", readAt = readAt, resources = resources, slot = slot)

    private fun wood(amount: Long, ratePerHour: Double, capacity: Long = 1000): StoredResource =
        StoredResource(ResourceKind.Wood, amount = amount, ratePerHour = ratePerHour, capacity = capacity)
}
