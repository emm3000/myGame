package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeMapRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class MapFoundingViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val freePlot: PlotAddress = PlotAddress(province = 3, plot = 7)

    private val sentFounding: AwayMarch =
        awayOn(MarchOrder.Found, freePlot, listOf(UnitCount(UnitKind.Settler, 1))).copy(foundingName = "Vega")

    @Test
    fun `offers a founding only with a settler at home`() = runTest {
        val settlerAway: MapViewModel = openOrdersOn(FakeFiefRepository(), fief(settlersAtHome = 0, settlersAway = 1))
        val settlerAtHome: MapViewModel = openOrdersOn(FakeFiefRepository(), fief(settlersAtHome = 1))

        assertEquals(
            listOf(false, true),
            listOf(settlerAway, settlerAtHome).map { MapUiState.OfferedOrder.Found in offeredOn(it, 7) },
        )
    }

    @Test
    fun `offers no founding on a camp, a reservation or a fief`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        assertEquals(
            emptyList<Int>(),
            contentOf(viewModel).offers
                .filter { it.order == MapUiState.OfferedOrder.Found && it.plot != 7 }
                .map { it.plot },
        )
    }

    @Test
    fun `proposes the name the screen gives for the plot's terrain`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        assertEquals("Vega", foundingForm(viewModel).nameEntry)
    }

    @Test
    fun `tallies the settlers at home`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository(), fief(settlersAtHome = 2, settlersAway = 1))

        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        assertEquals(2, foundingForm(viewModel).settlersAtHome)
    }

    @Test
    fun `takes the founding road at the settler's pace and arrives at its end`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        assertEquals(MapUiState.FoundingPreview(road = 6.minutes), foundingForm(viewModel).preview)
    }

    @Test
    fun `blocks a blank name`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        viewModel.onIntent(MapIntent.NameEntryChanged("   "))

        assertEquals(MapUiState.MarchBlock.BlankName, foundingForm(viewModel).block)
    }

    @Test
    fun `previews nothing for a blank name`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        viewModel.onIntent(MapIntent.NameEntryChanged("   "))

        assertNull(foundingForm(viewModel).preview)
    }

    @Test
    fun `blocks a founding while a march is away before a blank name`() = runTest {
        val away: AwayMarch = awayOn(MarchOrder.Forage, PlotAddress(province = 3, plot = 6), emptyList())
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository(), fief(march = away))
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        viewModel.onIntent(MapIntent.NameEntryChanged(""))

        assertEquals(MapUiState.MarchBlock.MarchAway, foundingForm(viewModel).block)
    }

    @Test
    fun `posts the plot and the name trimmed, once`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))
        viewModel.onIntent(MapIntent.NameEntryChanged("  Soto Alto  "))

        viewModel.onIntent(MapIntent.SendTapped)
        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            listOf(FakeFiefRepository.MarchRequest.Found(FiefId(FIEF_ID), freePlot, "Soto Alto")),
            fiefs.marches,
        )
    }

    @Test
    fun `sends a blank name so the api answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))
        viewModel.onIntent(MapIntent.NameEntryChanged("   "))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(listOf(""), fiefs.marches.map { (it as FakeFiefRepository.MarchRequest.Found).name })
    }

    @Test
    fun `draws the founding the api answers beside its plot`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))
        val founding: AwayMarch = awayOn(MarchOrder.Found, freePlot, listOf(UnitCount(UnitKind.Settler, 1)))
            .copy(foundingName = "Vega")
        fiefs.answerMarch(MarchResult.Answered(fief(settlersAtHome = 2, settlersAway = 1, march = founding)))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.SentFounding(
                target = freePlot,
                units = listOf(UnitCount(UnitKind.Settler, 1)),
                name = "Vega",
                arrivalIn = 3.minutes,
            ),
            contentOf(viewModel).sent,
        )
    }

    @Test
    fun `reads the province again after an answered send with the sent line still drawn`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs, maps = maps)
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))
        fiefs.answerMarch(MarchResult.Answered(fief(settlersAtHome = 0, settlersAway = 1, march = sentFounding)))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            listOf<Int?>(null, 3) to MapUiState.SentFounding::class,
            maps.requests to contentOf(viewModel).sent?.let { it::class },
        )
    }

    @Test
    fun `draws the founding's plot reserved once the province is read again`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val maps: FakeMapRepository = FakeMapRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs, maps = maps)
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))
        fiefs.answerMarch(MarchResult.Answered(fief(settlersAtHome = 0, settlersAway = 1, march = sentFounding)))
        viewModel.onIntent(MapIntent.SendTapped)

        maps.answerRead(MapReadResult.Read(ordersProvince.withPlot(MapPlot(7, PlotHolder.Reserved(isOwn = true)))))

        val drawn: MapUiState.Content = contentOf(viewModel)
        assertEquals(
            PlotHolder.Reserved(isOwn = true) to MapUiState.SentFounding::class,
            drawn.map.plots.first { it.plot == 7 }.holder to drawn.sent?.let { it::class },
        )
    }

    @Test
    fun `keeps the api's line for a fief past the cap beside the founding`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.FiefCapReached, FIEF_CAP_LINE))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(MapUiState.SendStatus.RefusedWithApiLine(FIEF_CAP_LINE), foundingForm(viewModel).send)
    }

    @Test
    fun `swaps the forage for the founding on the same plot`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.ForageToggled(7))

        viewModel.onIntent(MapIntent.FoundingToggled(7, proposedName = "Vega"))

        assertEquals(MapUiState.FoundingForm::class, contentOf(viewModel).form?.let { it::class })
    }

    private fun foundingForm(viewModel: MapViewModel): MapUiState.FoundingForm =
        contentOf(viewModel).form as MapUiState.FoundingForm
}

private fun ProvinceMap.withPlot(changed: MapPlot): ProvinceMap =
    copy(plots = plots.map { each: MapPlot -> if (each.plot == changed.plot) changed else each })

private const val FIEF_CAP_LINE: String = "Solo puedes tener 3 feudos. Deja al colono en casa."
