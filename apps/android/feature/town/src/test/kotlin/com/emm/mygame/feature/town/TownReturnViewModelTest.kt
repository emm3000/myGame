package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.feature.town.naming.NamingStatus
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

class TownReturnViewModelTest : TownViewModelFixture() {

    @Test
    fun `waits a minute after a failed read on return before reading again`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 1.minutes)))
        viewModel.onIntent(TownIntent.ScreenHidden)
        advanceTimeBy(2.minutes)
        repeat(OUTAGE_READS) { towns.answerRead(TownReadResult.Unreachable) }

        viewModel.onIntent(TownIntent.ScreenShown)
        runCurrent()
        val readsOnReturn: Int = towns.readCount
        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(listOf(2, 3), listOf(readsOnReturn, towns.readCount))
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
    fun `measures the clock gap again when the screen comes back`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(risingTownReadAt(readInstant + 3.hours)))
        viewModel.onIntent(TownIntent.ScreenShown)

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(101L, moneyOf(viewModel).amount)
    }

    @Test
    fun `reads once when the screen is shown twice`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(townOf()))
        viewModel.onIntent(TownIntent.ScreenShown)

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `asks for a name when the town is gone on return`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.NoTown)

        viewModel.onIntent(TownIntent.ScreenShown)

        assertEquals(TownUiState.Naming("", NamingStatus.Idle), viewModel.state.value)
    }
}
