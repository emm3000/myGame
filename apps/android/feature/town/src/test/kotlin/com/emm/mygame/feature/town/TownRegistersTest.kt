package com.emm.mygame.feature.town

import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TownRegistersTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val farmAtTwo: TownSnapshot = townOf(places = placesOf(placeAt(TownBuildingKind.Farm, level = 2)))

    private val farmAtThree: TownSnapshot =
        townOf(places = placesOf(placeAt(TownBuildingKind.Farm, level = 3)), readAt = readInstant + 1.minutes)

    @Test
    fun `plays nothing on the first read`() = runTest {
        val viewModel: TownViewModel = homeViewModel(farmAtThree)

        assertEquals(emptyMap<TownBuildingKind, Int>(), raisedOf(viewModel))
    }

    @Test
    fun `plays nothing when two reads agree`() = runTest {
        val viewModel: TownViewModel = homeViewModel(farmAtTwo)

        reread(viewModel, farmAtTwo.copy(readAt = readInstant + 1.minutes))

        assertEquals(emptyMap<TownBuildingKind, Int>(), raisedOf(viewModel))
    }

    @Test
    fun `pops the new window when a level finishes`() = runTest {
        val viewModel: TownViewModel = homeViewModel(farmAtTwo)

        reread(viewModel, farmAtThree)

        assertEquals(mapOf(TownBuildingKind.Farm to 2), raisedOf(viewModel))
    }

    @Test
    fun `gives a place its hue when first built`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(places = placesOf(placeAt(TownBuildingKind.Factory, level = 0))))

        reread(viewModel, townOf(places = placesOf(placeAt(TownBuildingKind.Factory, level = 1))))

        assertEquals(mapOf(TownBuildingKind.Factory to 0), raisedOf(viewModel))
    }

    @Test
    fun `keeps the row through a repaint between reads`() = runTest {
        val viewModel: TownViewModel = homeViewModel(farmAtTwo)
        reread(viewModel, farmAtThree)

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(mapOf(TownBuildingKind.Farm to 2), raisedOf(viewModel))
    }

    @Test
    fun `empties the row at a re-read with no change`() = runTest {
        val viewModel: TownViewModel = homeViewModel(farmAtTwo)
        reread(viewModel, farmAtThree)

        reread(viewModel, farmAtThree.copy(readAt = readInstant + 2.minutes))

        assertEquals(emptyMap<TownBuildingKind, Int>(), raisedOf(viewModel))
    }

    @Test
    fun `plays nothing on a fresh start`() = runTest {
        val viewModel: TownViewModel = homeViewModel(farmAtTwo)
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.NoTown)
        viewModel.onIntent(TownIntent.ScreenShown)
        runCurrent()
        towns.answerRead(TownReadResult.Read(farmAtThree))

        viewModel.onIntent(TownIntent.GoToTownTapped)
        runCurrent()

        assertEquals(emptyMap<TownBuildingKind, Int>(), raisedOf(viewModel))
    }

    @Test
    fun `pops the new window between the held town and the re-read behind it`() = runTest {
        towns.hold(HeldTown(farmAtTwo, gap = Duration.ZERO))
        val viewModel: TownViewModel = townViewModelOf(towns, start = readInstant)

        towns.answerRead(TownReadResult.Read(farmAtThree))
        runCurrent()

        assertEquals(mapOf(TownBuildingKind.Farm to 2), raisedOf(viewModel))
    }

    private fun TestScope.reread(viewModel: TownViewModel, next: TownSnapshot) {
        viewModel.onIntent(TownIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(next))
        viewModel.onIntent(TownIntent.ScreenShown)
        runCurrent()
    }

    private fun raisedOf(viewModel: TownViewModel): Map<TownBuildingKind, Int> = contentOf(viewModel).places
        .mapNotNull { place: TownUiState.PlaceCard ->
            place.raisedFrom?.let { levelBefore: Int -> place.kind to levelBefore }
        }
        .toMap()

    private fun TestScope.homeViewModel(town: TownSnapshot, start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return townViewModelOf(towns, start)
    }
}
