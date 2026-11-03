package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.UpgradeResult
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefVisibilityViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `reads nothing when a finish passes while another screen is on top`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.seconds))))
        viewModel.state.test { awaitContent() }

        viewModel.onIntent(FiefIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `reads the fief once back on the screen after a finish passed while hidden`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 2.seconds))))
        viewModel.state.test { awaitContent() }
        viewModel.onIntent(FiefIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        runCurrent()
        fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle, readAt = firstReadAt + 5.minutes)))

        viewModel.onIntent(FiefIntent.ScreenShown)
        advanceTimeBy(5.minutes)
        runCurrent()

        val drawn: FiefUiState.Content = viewModel.state.value as FiefUiState.Content
        assertEquals(2 to FiefUiState.SlotLine.Idle, fiefs.readCount to drawn.slot)
    }

    @Test
    fun `reads nothing when a finish passes after an upgrade answered while another screen is on top`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief()))
        viewModel.state.test { awaitContent() }
        viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
        viewModel.onIntent(FiefIntent.ScreenHidden)

        fiefs.answerUpgrade(UpgradeResult.Upgraded(fief(slot = busySlot(finishesIn = 2.seconds))))
        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `keeps projecting the last read when the read back on the screen cannot reach the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(resources = listOf(wood(amount = 500, ratePerHour = 60.0)))))
        viewModel.state.test { awaitContent() }
        viewModel.onIntent(FiefIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        fiefs.answerRead(FiefReadResult.Unreachable)

        viewModel.onIntent(FiefIntent.ScreenShown)
        val onReturn: Long = woodDrawn(viewModel)
        advanceTimeBy(10.minutes)
        runCurrent()

        assertEquals(505L to 515L, onReturn to woodDrawn(viewModel))
    }

    @Test
    fun `reads the fief back on the screen when it was hidden before the first answer`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        viewModel.onIntent(FiefIntent.ScreenHidden)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = BuildSlot.Idle)))

        viewModel.onIntent(FiefIntent.ScreenShown)

        viewModel.state.test { assertEquals(FiefUiState.SlotLine.Idle, awaitContent().slot) }
    }

    private fun woodDrawn(viewModel: FiefViewModel): Long =
        (viewModel.state.value as FiefUiState.Content).resources.first { it.kind == ResourceKind.Wood }.amount
}
