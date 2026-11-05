package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownFoundRefusal
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TownNamingViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    @Test
    fun `shows Name your town to a player with no town`() = runTest {
        towns.answerRead(TownReadResult.NoTown)

        assertEquals(TownUiState.Naming(name = "", status = TownUiState.NamingStatus.Idle), viewModelOf().state.value)
    }

    @Test
    fun `keeps what the player writes in the name`() = runTest {
        val viewModel: TownViewModel = namingViewModel()

        viewModel.onIntent(TownIntent.NameChanged("River"))

        assertEquals("River", (viewModel.state.value as TownUiState.Naming).name)
    }

    @Test
    fun `founds the town with the name the player wrote`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        viewModel.onIntent(TownIntent.NameChanged("Riverton"))

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(listOf("Riverton"), towns.foundings)
    }

    @Test
    fun `draws the name as submitting while the api answers`() = runTest {
        val viewModel: TownViewModel = namingViewModel()

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(TownUiState.NamingStatus.Submitting, (viewModel.state.value as TownUiState.Naming).status)
    }

    @Test
    fun `sends one founding on a double tap`() = runTest {
        val viewModel: TownViewModel = namingViewModel()

        viewModel.onIntent(TownIntent.NameSubmitted)
        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(1, towns.foundings.size)
    }

    @Test
    fun `founds the town and opens its home`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        viewModel.onIntent(TownIntent.NameChanged("Riverton"))
        towns.answerFound(TownFoundResult.Founded(townOf(name = "Riverton")))

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `measures the clock gap from the founding answer`() = runTest {
        val viewModel: TownViewModel = namingViewModel(start = readInstant + 1.hours)
        val rising: TownSnapshot =
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0)))
        towns.answerFound(TownFoundResult.Founded(rising))

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(100L, moneyOf(viewModel).amount)
    }

    @Test
    fun `carries a blank name refusal on the naming screen`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        towns.answerFound(TownFoundResult.Refused(TownFoundRefusal.BlankTownName))

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(
            TownUiState.NamingStatus.Refused(TownFoundRefusal.BlankTownName),
            (viewModel.state.value as TownUiState.Naming).status,
        )
    }

    @Test
    fun `keeps the name a refusal answered`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        viewModel.onIntent(TownIntent.NameChanged("Riverton"))
        towns.answerFound(TownFoundResult.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown))

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals("Riverton", (viewModel.state.value as TownUiState.Naming).name)
    }

    @Test
    fun `draws a failed founding so the player can send it again`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        towns.answerFound(TownFoundResult.Unreachable)

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(TownUiState.NamingStatus.Unreachable, (viewModel.state.value as TownUiState.Naming).status)
    }

    @Test
    fun `sends the founding again after a failure`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        towns.answerFound(TownFoundResult.Unreachable)
        viewModel.onIntent(TownIntent.NameSubmitted)

        viewModel.onIntent(TownIntent.NameSubmitted)

        assertEquals(2, towns.foundings.size)
    }

    @Test
    fun `opens the town a player already holds`() = runTest {
        val viewModel: TownViewModel = namingViewModel()
        towns.answerFound(TownFoundResult.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown))
        viewModel.onIntent(TownIntent.NameSubmitted)
        towns.answerRead(TownReadResult.Read(townOf(name = "Oldtown")))

        viewModel.onIntent(TownIntent.GoToTownTapped)

        assertEquals("Oldtown", contentOf(viewModel).name)
    }

    private fun TestScope.namingViewModel(start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.NoTown)
        return viewModelOf(start)
    }

    private fun TestScope.viewModelOf(start: Instant = readInstant): TownViewModel =
        townViewModelOf(towns, sessions, start)
}
