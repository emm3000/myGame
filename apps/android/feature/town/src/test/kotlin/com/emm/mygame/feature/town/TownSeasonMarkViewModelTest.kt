package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.SeasonProductionPercent
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.days

class TownSeasonMarkViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `marks food in summer`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(seasonOf(SeasonKind.Summer, production = unscaledProduction.copy(food = 125)))

        assertEquals(
            listOf(ProductionMark(TownResourceKind.Food, percent = 125)),
            contentOf(viewModel).season?.productionMarks,
        )
    }

    @Test
    fun `marks power in winter`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(seasonOf(SeasonKind.Winter, production = unscaledProduction.copy(power = 75)))

        assertEquals(
            listOf(ProductionMark(TownResourceKind.Power, percent = 75)),
            contentOf(viewModel).season?.productionMarks,
        )
    }

    @Test
    fun `marks every resource off 100 in the stock order`() = runTest {
        val production = SeasonProductionPercent(money = 110, food = 125, power = 75, material = 90)

        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Fall, production = production))

        assertEquals(
            listOf(
                ProductionMark(TownResourceKind.Money, percent = 110),
                ProductionMark(TownResourceKind.Food, percent = 125),
                ProductionMark(TownResourceKind.Power, percent = 75),
                ProductionMark(TownResourceKind.Material, percent = 90),
            ),
            contentOf(viewModel).season?.productionMarks,
        )
    }

    @Test
    fun `marks building work in summer`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Summer, build = 75))

        assertEquals(DurationMark(SeasonKind.Summer, percent = 75), contentOf(viewModel).buildMark)
    }

    @Test
    fun `marks building work that a season lengthens with the percent as sent`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Winter, build = 125))

        assertEquals(DurationMark(SeasonKind.Winter, percent = 125), contentOf(viewModel).buildMark)
    }

    @Test
    fun `marks nothing at 100`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Spring))

        assertEquals(emptyList<ProductionMark>(), contentOf(viewModel).season?.productionMarks)
    }

    @Test
    fun `marks no building work at 100`() = runTest {
        val viewModel: TownViewModel = homeViewModel(seasonOf(SeasonKind.Spring))

        assertNull(contentOf(viewModel).buildMark)
    }

    @Test
    fun `marks nothing before the epoch`() = runTest {
        val viewModel: TownViewModel = homeBeforeTheEpoch()

        assertNull(contentOf(viewModel).season)
    }

    @Test
    fun `marks no building work before the epoch`() = runTest {
        val viewModel: TownViewModel = homeBeforeTheEpoch()

        assertNull(contentOf(viewModel).buildMark)
    }

    private fun TestScope.homeBeforeTheEpoch(): TownViewModel {
        towns.answerRead(TownReadResult.Read(townOf(seasonInForce = null, seasonEndsAt = null)))
        return townViewModelOf(towns, readInstant)
    }

    private fun TestScope.homeViewModel(season: SeasonInForce): TownViewModel {
        val town: TownSnapshot = townOf(seasonInForce = season, seasonEndsAt = readInstant + 3.days)
        towns.answerRead(TownReadResult.Read(town))
        return townViewModelOf(towns, readInstant)
    }
}
