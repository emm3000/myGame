package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class MapTransportViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val otherFief: PlotAddress = PlotAddress(province = 3, plot = 4)

    private val fullStores: List<StoredResource> =
        ResourceKind.entries.map { kind: ResourceKind -> stock(kind, 5_000) }

    @Test
    fun `offers a transport only on the lord's other fief`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        assertEquals(
            listOf(4),
            contentOf(viewModel).offers.filter { it.order == MapUiState.OfferedOrder.Transport }.map { it.plot },
        )
    }

    @Test
    fun `offers the transport from the second fief on the first fief's plot alone`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository(), read = fief().copy(id = FiefId(OTHER_FIEF_ID)))

        assertEquals(
            listOf(MapUiState.OfferedOrder.Transport) to emptyList<MapUiState.OfferedOrder>(),
            offeredOn(viewModel, plot = 2) to offeredOn(viewModel, plot = 4),
        )
    }

    @Test
    fun `opens the transport with nothing loaded`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.TransportToggled(4))

        assertEquals(
            ResourceKind.entries.map { MapUiState.CargoEntry(it, "0") },
            transportForm(viewModel).cargoEntries,
        )
    }

    @Test
    fun `weighs the cargo against what the party carries`() = runTest {
        val viewModel: MapViewModel = loading(infantry = "0", cavalry = "5", wood = "300")

        assertEquals(300L to 600L, preview(viewModel).let { it.cargo to it.carry })
    }

    @Test
    fun `takes the transport's road at the slowest unit's pace`() = runTest {
        val viewModel: MapViewModel = loading(cavalry = "5", wood = "300")

        assertEquals(2.minutes, preview(viewModel).road)
    }

    @Test
    fun `weighs the cargo without a road for a party of no one`() = runTest {
        val viewModel: MapViewModel = loading(infantry = "0", wood = "300")

        assertEquals(MapUiState.TransportPreview(cargo = 300, carry = 0, road = null), preview(viewModel))
    }

    @Test
    fun `blocks an empty cargo`() = runTest {
        val viewModel: MapViewModel = loading(wood = "0")

        assertEquals(MapUiState.MarchBlock.EmptyCargo, transportForm(viewModel).block)
    }

    @Test
    fun `blocks a cargo above what the party carries`() = runTest {
        val viewModel: MapViewModel = loading(wood = "49")

        assertEquals(MapUiState.MarchBlock.CargoAboveCarry(cargo = 49, carry = 48), transportForm(viewModel).block)
    }

    @Test
    fun `lets a cargo of exactly what the party carries go`() = runTest {
        val viewModel: MapViewModel = loading(wood = "48")

        assertEquals(null, transportForm(viewModel).block)
    }

    @Test
    fun `blocks a cargo the fief does not hold, by the stored amounts`() = runTest {
        val viewModel: MapViewModel = loading(
            cavalry = "5",
            wood = "200",
            read = fief(cavalryAtHome = 5, stocks = listOf(stock(ResourceKind.Wood, 150))),
        )

        assertEquals(
            MapUiState.MarchBlock.Shortfalls(listOf(ResourceQuantity(ResourceKind.Wood, 50))),
            transportForm(viewModel).block,
        )
    }

    @Test
    fun `blocks an empty party before the cargo`() = runTest {
        val viewModel: MapViewModel = loading(infantry = "0", wood = "0")

        assertEquals(MapUiState.MarchBlock.EmptyParty, transportForm(viewModel).block)
    }

    @Test
    fun `blocks a cargo that is not whole`() = runTest {
        val viewModel: MapViewModel = loading(wood = "1.5")

        assertEquals(MapUiState.MarchBlock.InvalidCount, transportForm(viewModel).block)
    }

    @Test
    fun `posts the destination fief, the party and every resource of the cargo once`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = loading(cavalry = "5", wood = "300", fiefs = fiefs)
        viewModel.onIntent(MapIntent.CargoEntryChanged(ResourceKind.Food, "20"))

        viewModel.onIntent(MapIntent.SendTapped)
        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            listOf(
                FakeFiefRepository.MarchRequest.Transport(
                    fief = FiefId(FIEF_ID),
                    destination = FiefId(OTHER_FIEF_ID),
                    party = listOf(
                        UnitCount(UnitKind.Infantry, 1),
                        UnitCount(UnitKind.Cavalry, 5),
                        UnitCount(UnitKind.Archer, 0),
                    ),
                    cargo = listOf(
                        ResourceQuantity(ResourceKind.Wood, 300),
                        ResourceQuantity(ResourceKind.Stone, 0),
                        ResourceQuantity(ResourceKind.Iron, 0),
                        ResourceQuantity(ResourceKind.Gold, 0),
                        ResourceQuantity(ResourceKind.Food, 20),
                    ),
                ),
            ),
            fiefs.marches,
        )
    }

    @Test
    fun `sends nothing while the form is blocked`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = loading(wood = "0", fiefs = fiefs)

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(emptyList<FakeFiefRepository.MarchRequest>(), fiefs.marches)
    }

    @Test
    fun `draws only the block for a cargo above the carry once tapped`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = loading(wood = "49", fiefs = fiefs)

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.MarchBlock.CargoAboveCarry(cargo = 49, carry = 48) to MapUiState.SendStatus.Idle,
            transportForm(viewModel).block to transportForm(viewModel).send,
        )
    }

    @Test
    fun `sends nothing for a transport party of no one`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = loading(infantry = "0", wood = "10", fiefs = fiefs)

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(0, fiefs.marches.size)
    }

    @Test
    fun `keeps a cargo above the carry with the amounts the api sent beside the transport`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = loading(cavalry = "5", wood = "300", fiefs = fiefs)
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.CargoAboveCarry(cargo = 721, carry = 720)))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.SendStatus.Refused(MarchRefusal.CargoAboveCarry(cargo = 721, carry = 720)),
            transportForm(viewModel).send,
        )
    }

    @Test
    fun `draws the transport the api answers beside its plot`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = loading(wood = "40", fiefs = fiefs)
        val transport: AwayMarch = awayOn(MarchOrder.Transport, otherFief, listOf(UnitCount(UnitKind.Infantry, 1)))
            .copy(cargo = listOf(ResourceQuantity(ResourceKind.Wood, 40)))
        fiefs.answerMarch(MarchResult.Answered(fief(infantryAtHome = 11, march = transport)))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.SentTransport(
                target = otherFief,
                units = listOf(UnitCount(UnitKind.Infantry, 1)),
                cargo = listOf(ResourceQuantity(ResourceKind.Wood, 40)),
                arrivalIn = 3.minutes,
            ),
            contentOf(viewModel).sent,
        )
    }

    private fun loading(
        wood: String,
        infantry: String = "1",
        cavalry: String = "0",
        read: FiefSnapshot = fief(cavalryAtHome = 5, stocks = fullStores),
        fiefs: FakeFiefRepository = FakeFiefRepository(),
    ): MapViewModel {
        val viewModel: MapViewModel = openOrdersOn(fiefs, read)
        viewModel.onIntent(MapIntent.TransportToggled(4))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, infantry))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Cavalry, cavalry))
        viewModel.onIntent(MapIntent.CargoEntryChanged(ResourceKind.Wood, wood))
        return viewModel
    }

    private fun transportForm(viewModel: MapViewModel): MapUiState.TransportForm =
        contentOf(viewModel).form as MapUiState.TransportForm

    private fun preview(viewModel: MapViewModel): MapUiState.TransportPreview =
        requireNotNull(transportForm(viewModel).preview)
}
