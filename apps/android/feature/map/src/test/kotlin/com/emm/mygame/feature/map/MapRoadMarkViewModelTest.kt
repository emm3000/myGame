package com.emm.mygame.feature.map

import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.SeasonDurationPercent
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.SeasonProductionPercent
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

class MapRoadMarkViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val wasteMap: RegionMap = regionMapOf(
        sites = listOf(RegionMap.Site(site = 1, town = null, waste = null), wasteSiteOf(site = 4)),
    )

    @Test
    fun `marks the way in fall on a job`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(seasonOf(SeasonKind.Fall, road = 75), site = 1)

        assertEquals(MapUiState.DurationMark(SeasonKind.Fall, percent = 75), contentOf(viewModel).form?.roadMark)
    }

    @Test
    fun `marks the way in fall on a clean-up`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(seasonOf(SeasonKind.Fall, road = 75), site = 4)

        assertEquals(MapUiState.DurationMark(SeasonKind.Fall, percent = 75), contentOf(viewModel).form?.roadMark)
    }

    @Test
    fun `marks a way that a season lengthens with the percent as sent`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(seasonOf(SeasonKind.Winter, road = 125), site = 1)

        assertEquals(MapUiState.DurationMark(SeasonKind.Winter, percent = 125), contentOf(viewModel).form?.roadMark)
    }

    @Test
    fun `marks nothing at 100`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(seasonOf(SeasonKind.Summer, road = 100), site = 1)

        assertNull(contentOf(viewModel).form?.roadMark)
    }

    @Test
    fun `marks nothing at 100 on a clean-up`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(seasonOf(SeasonKind.Summer, road = 100), site = 4)

        assertNull(contentOf(viewModel).form?.roadMark)
    }

    @Test
    fun `marks nothing before the epoch`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(season = null, site = 1)

        assertNull(contentOf(viewModel).form?.roadMark)
    }

    @Test
    fun `marks nothing before the epoch on a clean-up`() = runTest {
        val viewModel: MapViewModel = viewModelWithFormAt(season = null, site = 4)

        assertNull(contentOf(viewModel).form?.roadMark)
    }

    private fun TestScope.viewModelWithFormAt(season: SeasonInForce?, site: Int): MapViewModel {
        val town: TownSnapshot = townOf(
            seasonInForce = season,
            seasonEndsAt = if (season == null) null else readInstant + 3.days,
        )
        val viewModel: MapViewModel = mapReading(towns, town = town, map = wasteMap)
        viewModel.onIntent(MapIntent.SendTeamTapped(site = site))
        return viewModel
    }

    private fun seasonOf(kind: SeasonKind, road: Int): SeasonInForce = SeasonInForce(
        kind = kind,
        year = 1,
        productionPercent = SeasonProductionPercent(money = 100, food = 100, power = 100, material = 100),
        durationPercent = SeasonDurationPercent(build = 100, study = 100, hire = 100, road = road),
    )
}
