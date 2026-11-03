package com.emm.mygame.feature.chronicle

import app.cash.turbine.test
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.ChronicleReadResult
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.testing.FakeChronicleRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ChronicleViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val routeFief: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    private val openedAt: Instant = Instant.parse("2026-11-02T19:00:00Z")

    private val sawmillFinished: ChronicleEvent = ChronicleEvent.UpgradeFinished(
        building = BuildingKind.Sawmill,
        level = 3,
        occurredAt = Instant.parse("2026-11-02T18:40:00Z"),
    )

    private val levyDelivered: ChronicleEvent = ChronicleEvent.RecruitsDelivered(
        unit = UnitKind.Infantry,
        count = 12,
        occurredAt = Instant.parse("2026-11-02T18:55:00Z"),
    )

    @Test
    fun `draws the loading state while the api answers`() = runTest {
        val viewModel: ChronicleViewModel = viewModel(FakeChronicleRepository())

        assertEquals(ChronicleUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `lists the events in the order the api answers`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()
        val viewModel: ChronicleViewModel = viewModel(chronicles)

        viewModel.state.test {
            skipItems(1)
            chronicles.answerRead(ChronicleReadResult.Read(listOf(levyDelivered, sawmillFinished)))
            assertEquals(listOf(levyDelivered, sawmillFinished), (awaitItem() as ChronicleUiState.Content).events)
        }
    }

    @Test
    fun `dates the lines against the device clock when the answer arrives`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()
        val viewModel: ChronicleViewModel = viewModel(chronicles)
        advanceTimeBy(3.seconds)

        chronicles.answerRead(ChronicleReadResult.Read(listOf(sawmillFinished)))

        assertEquals(openedAt + 3.seconds, (viewModel.state.value as ChronicleUiState.Content).readAt)
    }

    @Test
    fun `draws the empty chronicle when the api lists no event`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()
        val viewModel: ChronicleViewModel = viewModel(chronicles)

        chronicles.answerRead(ChronicleReadResult.Read(emptyList()))

        assertEquals(ChronicleUiState.Empty, viewModel.state.value)
    }

    @Test
    fun `offers a retry when the api cannot be reached`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()
        val viewModel: ChronicleViewModel = viewModel(chronicles)

        chronicles.answerRead(ChronicleReadResult.Unreachable)

        assertEquals(ChronicleUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the chronicle again on retry`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()
        val viewModel: ChronicleViewModel = viewModel(chronicles)
        chronicles.answerRead(ChronicleReadResult.Unreachable)

        viewModel.state.test {
            skipItems(1)
            viewModel.onIntent(ChronicleIntent.RetryTapped)
            assertEquals(ChronicleUiState.Loading, awaitItem())
            chronicles.answerRead(ChronicleReadResult.Read(listOf(sawmillFinished)))
            assertEquals(listOf(sawmillFinished), (awaitItem() as ChronicleUiState.Content).events)
        }
    }

    @Test
    fun `reads the chronicle of the fief the route names`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()

        viewModel(chronicles)

        assertEquals(listOf(routeFief), chronicles.reads)
    }

    @Test
    fun `ignores a retry while the chronicle is read`() = runTest {
        val chronicles: FakeChronicleRepository = FakeChronicleRepository()
        val viewModel: ChronicleViewModel = viewModel(chronicles)

        viewModel.onIntent(ChronicleIntent.RetryTapped)

        assertEquals(1, chronicles.readCount)
    }

    private fun TestScope.viewModel(chronicles: FakeChronicleRepository): ChronicleViewModel =
        ChronicleViewModel(fief = routeFief, chronicles = chronicles, clock = TestClock(testScheduler, openedAt))
}
