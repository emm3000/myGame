package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class MapAttackViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val strongCamp: PlotAddress = PlotAddress(province = 3, plot = 5)

    @Test
    fun `offers an attack and nothing else on a camp's plot`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        assertEquals(listOf(MapUiState.OfferedOrder.Attack), offeredOn(viewModel, 5))
    }

    @Test
    fun `offers no attack on a free plot`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        assertEquals(listOf(MapUiState.OfferedOrder.Forage, MapUiState.OfferedOrder.Found), offeredOn(viewModel, 7))
    }

    @Test
    fun `opens the attack with one of the first kind at home and no settler`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.AttackToggled(5))

        assertEquals(
            listOf(
                MapUiState.PartyEntry(UnitKind.Infantry, "1"),
                MapUiState.PartyEntry(UnitKind.Cavalry, "0"),
                MapUiState.PartyEntry(UnitKind.Archer, "0"),
            ),
            attackForm(viewModel).entries,
        )
    }

    @Test
    fun `returns from an attack after the road both ways, with no stay`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())

        viewModel.onIntent(MapIntent.AttackToggled(5))

        assertEquals(3.minutes to 6.minutes, preview(viewModel).let { it.road to it.returnIn })
    }

    @Test
    fun `wins the battle when the party is stronger than the camp`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 20, camp = 5)

        assertEquals(true, preview(viewModel).isWon)
    }

    @Test
    fun `loses the battle when the party is no stronger than the camp`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 15, camp = 5)

        assertEquals(false, preview(viewModel).isWon)
    }

    @Test
    fun `loses to a won battle the camp's strength squared over the party's, rounded up`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 20, camp = 5)

        assertEquals(
            listOf(UnitCount(UnitKind.Infantry, 12)) to listOf(UnitCount(UnitKind.Infantry, 8)),
            preview(viewModel).let { it.unitsLost to it.survivors },
        )
    }

    @Test
    fun `takes a won battle's losses from the first kind sent before the next`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 4, cavalry = 4, camp = 8)

        assertEquals(
            listOf(UnitCount(UnitKind.Infantry, 4), UnitCount(UnitKind.Cavalry, 3)),
            preview(viewModel).unitsLost,
        )
    }

    @Test
    fun `spares the last unit reached when a won battle's losses would take every one`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 14, cavalry = 1, camp = 5)

        assertEquals(
            listOf(UnitCount(UnitKind.Infantry, 0), UnitCount(UnitKind.Cavalry, 1)),
            preview(viewModel).survivors,
        )
    }

    @Test
    fun `kills the camp's whole strength in a won battle`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 20, camp = 5)

        assertEquals(15, preview(viewModel).campLost)
    }

    @Test
    fun `loses the whole party in a lost battle`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 12, camp = 5)

        assertEquals(
            listOf(UnitCount(UnitKind.Infantry, 12)) to listOf(UnitCount(UnitKind.Infantry, 0)),
            preview(viewModel).let { it.unitsLost to it.survivors },
        )
    }

    @Test
    fun `kills in a lost battle the party's strength squared over the camp's, rounded up`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 12, camp = 5)

        assertEquals(10, preview(viewModel).campLost)
    }

    @Test
    fun `leaves a camp that wins at least one of its strength`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 15, camp = 5)

        assertEquals(14, preview(viewModel).campLost)
    }

    @Test
    fun `shares the attack's loot equally among the yielded resources and gold`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 20, camp = 8)

        assertEquals(
            listOf(
                ResourceQuantity(ResourceKind.Wood, 200),
                ResourceQuantity(ResourceKind.Gold, 200),
                ResourceQuantity(ResourceKind.Food, 200),
            ),
            preview(viewModel).loot,
        )
    }

    @Test
    fun `caps the attack's loot at what the survivors carry`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 20, camp = 5)

        assertEquals(listOf(128L, 128L, 128L), preview(viewModel).loot.map { it.amount })
    }

    @Test
    fun `weighs no season on the attack's loot`() = runTest {
        val seasonal: FiefSnapshot = fief(infantryAtHome = 20, season = season(food = 150))
        val viewModel: MapViewModel = attackingWith(infantry = 20, camp = 8, read = seasonal)

        assertEquals(listOf(200L, 200L, 200L), preview(viewModel).loot.map { it.amount })
    }

    @Test
    fun `loots nothing from a lost battle`() = runTest {
        val viewModel: MapViewModel = attackingWith(infantry = 12, camp = 5)

        assertEquals(emptyList<ResourceQuantity>(), preview(viewModel).loot)
    }

    @Test
    fun `blocks an attack while a march is away`() = runTest {
        val away: AwayMarch = awayOn(MarchOrder.Forage, PlotAddress(province = 3, plot = 7), emptyList())
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository(), fief(march = away))

        viewModel.onIntent(MapIntent.AttackToggled(5))

        assertEquals(MapUiState.MarchBlock.MarchAway, attackForm(viewModel).block)
    }

    @Test
    fun `blocks an attack party larger than the units at home`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.AttackToggled(5))

        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Cavalry, "5"))

        assertEquals(MapUiState.MarchBlock.NotEnoughAtHome(UnitKind.Cavalry, 5, 4), attackForm(viewModel).block)
    }

    @Test
    fun `sends no settler on an attack`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.AttackToggled(5))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            listOf(UnitKind.Infantry, UnitKind.Cavalry, UnitKind.Archer),
            (fiefs.marches.single() as FakeFiefRepository.MarchRequest.Attack).party.map { it.unit },
        )
    }

    @Test
    fun `posts the camp's plot and the party once`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.AttackToggled(5))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Cavalry, "2"))

        viewModel.onIntent(MapIntent.SendTapped)
        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            listOf(
                FakeFiefRepository.MarchRequest.Attack(
                    fief = FiefId(FIEF_ID),
                    target = strongCamp,
                    party = listOf(
                        UnitCount(UnitKind.Infantry, 1),
                        UnitCount(UnitKind.Cavalry, 2),
                        UnitCount(UnitKind.Archer, 0),
                    ),
                ),
            ),
            fiefs.marches,
        )
    }

    @Test
    fun `sends nothing for an attack party of no one`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.AttackToggled(5))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, "0"))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(0, fiefs.marches.size)
    }

    @Test
    fun `draws the attack the api answers beside its plot`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.AttackToggled(5))
        val attack: AwayMarch = awayOn(MarchOrder.Attack, strongCamp, listOf(UnitCount(UnitKind.Infantry, 1)))
            .copy(camp = MarchCamp(tier = 2, strength = 15), loot = listOf(ResourceQuantity(ResourceKind.Gold, 9)))
        fiefs.answerMarch(MarchResult.Answered(fief(infantryAtHome = 11, march = attack)))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(
            MapUiState.SentAttack(
                target = strongCamp,
                units = listOf(UnitCount(UnitKind.Infantry, 1)),
                camp = MarchCamp(tier = 2, strength = 15),
                returnIn = 6.minutes,
                loot = listOf(ResourceQuantity(ResourceKind.Gold, 9)),
            ),
            contentOf(viewModel).sent,
        )
    }

    @Test
    fun `keeps the api's refusal of a plot with no camp beside the attack`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: MapViewModel = openOrdersOn(fiefs)
        viewModel.onIntent(MapIntent.AttackToggled(5))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.PlotHasNoCamp))

        viewModel.onIntent(MapIntent.SendTapped)

        assertEquals(MapUiState.SendStatus.Refused(MarchRefusal.PlotHasNoCamp), attackForm(viewModel).send)
    }

    @Test
    fun `closes the attack when its plot's attack is tapped again`() = runTest {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository())
        viewModel.onIntent(MapIntent.AttackToggled(5))

        viewModel.onIntent(MapIntent.AttackToggled(5))

        assertNull(contentOf(viewModel).form)
    }

    private fun attackingWith(
        infantry: Int,
        camp: Int,
        cavalry: Int = 0,
        read: FiefSnapshot = fief(infantryAtHome = infantry, cavalryAtHome = cavalry),
    ): MapViewModel {
        val viewModel: MapViewModel = openOrdersOn(FakeFiefRepository(), read)
        viewModel.onIntent(MapIntent.AttackToggled(camp))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Infantry, infantry.toString()))
        viewModel.onIntent(MapIntent.PartyEntryChanged(UnitKind.Cavalry, cavalry.toString()))
        return viewModel
    }

    private fun attackForm(viewModel: MapViewModel): MapUiState.AttackForm =
        contentOf(viewModel).form as MapUiState.AttackForm

    private fun preview(viewModel: MapViewModel): MapUiState.AttackPreview =
        requireNotNull(attackForm(viewModel).preview)
}
