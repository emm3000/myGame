package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeMapRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class MapForageViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val freePlot: PlotAddress = PlotAddress(province = 3, plot = 7)

    @Test
    fun `offers a march on a free plot`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())

        assertEquals(listOf(7), forageablePlotsOf(viewModel))
    }

    @Test
    fun `offers no march on a plot with a camp`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())

        assertFalse(5 in forageablePlotsOf(viewModel))
    }

    @Test
    fun `offers no march until the fief is read`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, FakeFiefRepository())
        maps.answerRead(MapReadResult.Read(mixedProvince))

        assertEquals(emptyList<Int>(), forageablePlotsOf(viewModel))
    }

    @Test
    fun `reads the fief again with the next province when it could not be read`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, fiefs)
        fiefs.answerRead(FiefReadResult.Unreachable)
        maps.answerRead(MapReadResult.Read(mixedProvince))

        viewModel.onIntent(MapIntent.NextTapped)

        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `opens the form with one of the first kind at home and one hour`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertEquals(
            listOf("1", "0", "0") to "1",
            form(viewModel).entries.map { it.entry } to form(viewModel).hoursEntry,
        )
    }

    @Test
    fun `starts the party with the first kind the fief has at home`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository(), fief(infantryAtHome = 0))

        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertEquals(listOf("0", "1", "0"), form(viewModel).entries.map { it.entry })
    }

    @Test
    fun `never offers a settler in the party`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertEquals(
            listOf(UnitKind.Infantry, UnitKind.Cavalry, UnitKind.Archer),
            form(viewModel).entries.map { it.unit },
        )
    }

    @Test
    fun `counts at home the units not on the march`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository(), fief(infantryAtHome = 7, infantryAway = 5))

        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertEquals(UnitCount(UnitKind.Infantry, 7), form(viewModel).atHome.first())
    }

    @Test
    fun `closes the form when its plot is tapped again`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertNull(content(viewModel).form)
    }

    @Test
    fun `takes the road at the pace of the slowest unit sent`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Cavalry, "1"))

        assertEquals(300.seconds, form(viewModel).preview?.road)
    }

    @Test
    fun `rounds the road up to the whole second`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository(), fief(infantryAtHome = 0, season = season(road = 33)))
        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertEquals(50.seconds, form(viewModel).preview?.road)
    }

    @Test
    fun `returns after the road both ways and the stay`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.HoursEntryChanged("2"))

        assertEquals(130.minutes, form(viewModel).preview?.returnIn)
    }

    @Test
    fun `loots each yielded resource per head and hour`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "2"))

        viewModel.onIntent(MapIntent.HoursEntryChanged("3"))

        assertEquals(
            listOf(ResourceQuantity(ResourceKind.Wood, 30), ResourceQuantity(ResourceKind.Food, 18)),
            form(viewModel).preview?.loot,
        )
    }

    @Test
    fun `caps the loot at the party's carry shared among the yielded resources`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.HoursEntryChanged("8"))

        assertEquals(
            listOf(ResourceQuantity(ResourceKind.Wood, 24), ResourceQuantity(ResourceKind.Food, 24)),
            form(viewModel).preview?.loot,
        )
    }

    @Test
    fun `weighs the loot by the season's percent`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository(), fief(season = season(food = 125)))
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "2"))

        viewModel.onIntent(MapIntent.HoursEntryChanged("3"))

        assertEquals(ResourceQuantity(ResourceKind.Food, 22), form(viewModel).preview?.loot?.last())
    }

    @Test
    fun `previews nothing for hours past the longest stay`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.HoursEntryChanged("9"))

        assertNull(form(viewModel).preview)
    }

    @Test
    fun `blocks the send while a march is away`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository(), fief(march = forage(freePlot, infantry = 2)))

        viewModel.onIntent(MapIntent.ForageToggled(7))

        assertEquals(MapUiState.MarchBlock.MarchAway, form(viewModel).block)
    }

    @Test
    fun `blocks a count that is not whole`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Cavalry, "1.5"))

        assertEquals(MapUiState.MarchBlock.InvalidCount, form(viewModel).block)
    }

    @Test
    fun `blocks hours past the longest stay`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.HoursEntryChanged("9"))

        assertEquals(MapUiState.MarchBlock.InvalidHours(maxStayHours = 8), form(viewModel).block)
    }

    @Test
    fun `blocks a party of no one`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, ""))

        assertEquals(MapUiState.MarchBlock.EmptyParty, form(viewModel).block)
    }

    @Test
    fun `blocks a party larger than the units at home`() = runTest {
        val viewModel: MapViewModel = openOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "13"))

        assertEquals(
            MapUiState.MarchBlock.NotEnoughAtHome(UnitKind.Infantry, needed = 13, atHome = 12),
            form(viewModel).block,
        )
    }

    @Test
    fun `posts the plot, the party and the hours once`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.HoursEntryChanged("4"))

        viewModel.onIntent(MapIntent.SendTapped)
        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            listOf(
                FakeFiefRepository.MarchRequest.Forage(
                    fief = FiefId(FIEF_ID),
                    target = freePlot,
                    party = listOf(
                        UnitCount(UnitKind.Infantry, 1),
                        UnitCount(UnitKind.Cavalry, 0),
                        UnitCount(UnitKind.Archer, 0),
                    ),
                    stayHours = 4,
                ),
            ),
            fiefs.marches,
        )
    }

    @Test
    fun `sends nothing while the form is blocked`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs, fief(march = forage(freePlot, infantry = 2)))
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(emptyList<FakeFiefRepository.MarchRequest>(), fiefs.marches)
    }

    @Test
    fun `draws only the block for a party short at home once tapped`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "13"))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.MarchBlock.NotEnoughAtHome(UnitKind.Infantry, needed = 13, atHome = 12) to
                MapUiState.SendStatus.Idle,
            form(viewModel).block to form(viewModel).send,
        )
    }

    @Test
    fun `sends nothing for a stay past the longest`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.HoursEntryChanged("9"))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(emptyList<FakeFiefRepository.MarchRequest>(), fiefs.marches)
    }

    @Test
    fun `sends nothing for a count that is not whole`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "-1"))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(0, fiefs.marches.size)
    }

    @Test
    fun `sends nothing for hours that name no whole hour`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.HoursEntryChanged("0"))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(0, fiefs.marches.size)
    }

    @Test
    fun `sends nothing for a party of no one`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "0"))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(0, fiefs.marches.size)
    }

    @Test
    fun `draws the march the api answers beside its plot`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        fiefs.answerMarch(MarchResult.Answered(fief(infantryAtHome = 10, march = forage(freePlot, infantry = 2))))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.SentForage(
                target = freePlot,
                units = listOf(UnitCount(UnitKind.Infantry, 2)),
                returnIn = 70.minutes,
                loot = listOf(ResourceQuantity(ResourceKind.Wood, 15), ResourceQuantity(ResourceKind.Food, 9)),
            ),
            content(viewModel).sent,
        )
    }

    @Test
    fun `closes the form once the march is sent`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        fiefs.answerMarch(MarchResult.Answered(fief(infantryAtHome = 10, march = forage(freePlot, infantry = 2))))

        viewModel.onIntent(MapIntent.SendTapped)

        assertNull(content(viewModel).form)
    }

    @Test
    fun `keeps the api's line for a party short at home beside the form`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.NotEnoughUnitsAtHome, SHORT_AT_HOME_LINE))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(MapUiState.SendStatus.RefusedWithApiLine(SHORT_AT_HOME_LINE), form(viewModel).send)
    }

    @Test
    fun `keeps the api's line for a stay out of range beside the form`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.StayOutOfRange, STAY_OUT_OF_RANGE_LINE))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(MapUiState.SendStatus.RefusedWithApiLine(STAY_OUT_OF_RANGE_LINE), form(viewModel).send)
    }

    @Test
    fun `keeps the refusal the api names beside the form`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.PlotReserved, PLOT_RESERVED_LINE))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(MapUiState.SendStatus.Refused(MarchRefusal.PlotReserved), form(viewModel).send)
    }

    @Test
    fun `keeps an outage beside the form`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOn(fiefs)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        fiefs.answerMarch(MarchResult.Unreachable)

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(MapUiState.SendStatus.Unreachable, form(viewModel).send)
    }

    @Test
    fun `drops the form when another province is read`() = runTest {
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = openOn(FakeFiefRepository(), maps = maps)
        viewModel.onIntent(MapIntent.ForageToggled(7))
        viewModel.onIntent(MapIntent.NextTapped)

        maps.answerRead(MapReadResult.Read(mixedProvince.copy(province = 4)))

        assertNull(content(viewModel).form)
    }

    private fun openOn(
        fiefs: FakeFiefRepository,
        read: FiefSnapshot = fief(),
        maps: FakeMapRepository = FakeMapRepository(),
    ): MapViewModel {
        fiefs.answerRead(FiefReadResult.Read(read))
        val viewModel: MapViewModel = MapViewModel(FiefId(FIEF_ID), maps, fiefs)
        maps.answerRead(MapReadResult.Read(mixedProvince))
        return viewModel
    }

    private fun content(viewModel: MapViewModel): MapUiState.Content = viewModel.state.value as MapUiState.Content

    private fun form(viewModel: MapViewModel): MapUiState.ForageForm =
        content(viewModel).form as MapUiState.ForageForm

    private fun forageablePlotsOf(viewModel: MapViewModel): List<Int> = content(viewModel).offers
        .filter { offer: MapUiState.PlotOffer -> offer.order == MapUiState.OfferedOrder.Forage }
        .map { offer: MapUiState.PlotOffer -> offer.plot }
}

private const val SHORT_AT_HOME_LINE: String = "Necesitas 7 jinetes en casa y tienes 6. Ajusta la marcha."

private const val PLOT_RESERVED_LINE: String =
    "Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra."

private const val STAY_OUT_OF_RANGE_LINE: String = "Una marcha forrajea de 1 a 12 horas enteras. Ajusta las horas."
