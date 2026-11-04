package com.emm.mygame.feature.map

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeMapRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Rule
import org.junit.Test

class MapViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `draws the loading state while the api answers`() = runTest {
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), FakeMapRepository(), FakeFiefRepository())

        assertEquals(MapUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `reads the own province first`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()

        MapViewModel(FiefId(FIEF_ID), maps, FakeFiefRepository())

        assertEquals(listOf<Int?>(null), maps.requests)
    }

    @Test
    fun `reads the map of the fief the route names`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val fiefOnScreen: FiefId = FiefId(OTHER_FIEF_ID)

        MapViewModel(fiefOnScreen, maps, FakeFiefRepository())

        assertEquals(listOf(fiefOnScreen), maps.fiefs)
    }

    @Test
    fun `reads the offers from the fief the route names`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val fiefOnScreen: FiefId = FiefId(OTHER_FIEF_ID)

        MapViewModel(fiefOnScreen, FakeMapRepository(), fiefs)

        assertEquals(listOf(fiefOnScreen), fiefs.reads)
    }

    @Test
    fun `reads a named province from the fief the route names`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val fiefOnScreen: FiefId = FiefId(OTHER_FIEF_ID)
        val viewModel: MapViewModel = MapViewModel(fiefOnScreen, maps, FakeFiefRepository())
        maps.answerRead(MapReadResult.Read(thirdProvince))

        viewModel.onIntent(MapIntent.NextTapped)

        assertEquals(listOf(fiefOnScreen, fiefOnScreen), maps.fiefs)
    }

    @Test
    fun `draws the province the api answers`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, FakeFiefRepository())

        maps.answerRead(MapReadResult.Read(thirdProvince))

        assertEquals(idleContentOf(thirdProvince, jumpEntry = "3"), viewModel.state.value)
    }

    @Test
    fun `offers a retry when the api cannot be reached`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, FakeFiefRepository())

        maps.answerRead(MapReadResult.Unreachable)

        assertEquals(MapUiState.Failed(ProvinceRequest.Own), viewModel.state.value)
    }

    @Test
    fun `reads again on retry the province that failed`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)
        viewModel.onIntent(MapIntent.NextTapped)
        maps.answerRead(MapReadResult.Unreachable)

        viewModel.onIntent(MapIntent.RetryTapped)

        assertEquals(listOf(null, 4, 4), maps.requests)
    }

    @Test
    fun `ignores a retry while the map is read`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, FakeFiefRepository())

        viewModel.onIntent(MapIntent.RetryTapped)

        assertEquals(listOf<Int?>(null), maps.requests)
    }

    @Test
    fun `reads the previous province`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)

        viewModel.onIntent(MapIntent.PreviousTapped)

        assertEquals(listOf(null, 2), maps.requests)
    }

    @Test
    fun `reads the next province`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)

        viewModel.onIntent(MapIntent.NextTapped)

        assertEquals(listOf(null, 4), maps.requests)
    }

    @Test
    fun `draws the loading state while another province is read`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)

        viewModel.state.test {
            skipItems(1)
            viewModel.onIntent(MapIntent.NextTapped)
            assertEquals(MapUiState.Loading, awaitItem())
            maps.answerRead(MapReadResult.Read(lastProvince))
            assertEquals(idleContentOf(lastProvince, jumpEntry = "9"), awaitItem())
        }
    }

    @Test
    fun `offers no previous province at the first one`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, firstProvince)

        assertFalse((viewModel.state.value as MapUiState.Content).hasPrevious)
    }

    @Test
    fun `offers no next province past the last one`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, lastProvince)

        assertFalse((viewModel.state.value as MapUiState.Content).hasNext)
    }

    @Test
    fun `asks for no province below the first one`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, firstProvince)

        viewModel.onIntent(MapIntent.PreviousTapped)

        assertEquals(listOf<Int?>(null), maps.requests)
    }

    @Test
    fun `asks for no province past the last one`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, lastProvince)

        viewModel.onIntent(MapIntent.NextTapped)

        assertEquals(listOf<Int?>(null), maps.requests)
    }

    @Test
    fun `keeps the number the player types`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)

        viewModel.onIntent(MapIntent.JumpEntryChanged("7"))

        assertEquals("7", (viewModel.state.value as MapUiState.Content).jumpEntry)
    }

    @Test
    fun `jumps to the province the player types`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)
        viewModel.onIntent(MapIntent.JumpEntryChanged("7"))

        viewModel.onIntent(MapIntent.JumpTapped)

        assertEquals(listOf(null, 7), maps.requests)
    }

    @Test
    fun `asks the api for a typed province past the last one`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)
        viewModel.onIntent(MapIntent.JumpEntryChanged("12"))

        viewModel.onIntent(MapIntent.JumpTapped)

        assertEquals(listOf(null, 12), maps.requests)
    }

    @Test
    fun `ignores a jump that names no province`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)
        viewModel.onIntent(MapIntent.JumpEntryChanged("0"))

        viewModel.onIntent(MapIntent.JumpTapped)

        assertEquals(listOf<Int?>(null), maps.requests)
    }

    @Test
    fun `draws the not-found line for a province the map lacks`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)
        viewModel.onIntent(MapIntent.JumpEntryChanged("12"))
        viewModel.onIntent(MapIntent.JumpTapped)

        maps.answerRead(MapReadResult.ProvinceNotFound)

        assertEquals(MapUiState.ProvinceNotFound, viewModel.state.value)
    }

    @Test
    fun `reads the own province again from the not-found line`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = contentOf(maps, thirdProvince)
        viewModel.onIntent(MapIntent.JumpEntryChanged("12"))
        viewModel.onIntent(MapIntent.JumpTapped)
        maps.answerRead(MapReadResult.ProvinceNotFound)

        viewModel.onIntent(MapIntent.OwnProvinceTapped)

        assertEquals(listOf(null, 12, null), maps.requests)
    }

    private fun idleContentOf(map: ProvinceMap, jumpEntry: String): MapUiState.Content =
        MapUiState.Content(map, jumpEntry = jumpEntry, offers = emptyList(), form = null, sent = null)

    private fun contentOf(maps: FakeMapRepository, shown: ProvinceMap): MapViewModel {
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, FakeFiefRepository())
        maps.answerRead(MapReadResult.Read(shown))
        return viewModel
    }

    private fun province(number: Int): ProvinceMap = ProvinceMap(
        kingdom = 1,
        province = number,
        lastProvince = 9,
        terrain = Terrain.Lowlands,
        plots = listOf(MapPlot(plot = 1, holder = PlotHolder.Free)),
    )

    private val firstProvince: ProvinceMap = province(1)

    private val thirdProvince: ProvinceMap = province(3)

    private val lastProvince: ProvinceMap = province(9)
}
