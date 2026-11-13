package com.emm.mygame.feature.town

import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.days
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class TownHireMarkViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `marks hiring in spring`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Spring, hire = 75))

        assertEquals(TownUiState.DurationMark(SeasonKind.Spring, percent = 75), contentOf(viewModel).office.hireMark)
    }

    @Test
    fun `marks hiring that a season lengthens with the percent as sent`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Winter, hire = 125))

        assertEquals(TownUiState.DurationMark(SeasonKind.Winter, percent = 125), contentOf(viewModel).office.hireMark)
    }

    @Test
    fun `marks nothing at 100`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Summer, hire = 100))

        assertNull(contentOf(viewModel).office.hireMark)
    }

    @Test
    fun `marks nothing before the epoch`() = runTest {
        towns.answerRead(TownReadResult.Read(townOf(seasonInForce = null, seasonEndsAt = null)))

        val viewModel: TownViewModel = townViewModelOf(towns, readInstant)

        assertNull(contentOf(viewModel).office.hireMark)
    }

    private fun TestScope.homeViewModel(season: SeasonInForce): TownViewModel {
        val town: TownSnapshot = townOf(seasonInForce = season, seasonEndsAt = readInstant + 3.days)
        towns.answerRead(TownReadResult.Read(town))
        return townViewModelOf(towns, readInstant)
    }
}
