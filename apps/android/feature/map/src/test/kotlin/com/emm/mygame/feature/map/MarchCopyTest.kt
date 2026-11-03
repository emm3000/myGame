package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class MarchCopyTest {

    private val resources: Resources = RuntimeEnvironment.getApplication().resources

    private val seventhPlot: PlotAddress = PlotAddress(province = 3, plot = 7)

    @Test
    fun `names the march action after its plot`() {
        assertEquals("Enviar una marcha a parcela 7", resources.actionNameOf(MapUiState.OfferedOrder.Forage, 7))
    }

    @Test
    fun `titles the form with the province and the plot`() {
        assertEquals("Marcha a provincia 3, parcela 7", resources.titleOf(forageFormOn(seventhPlot)))
    }

    @Test
    fun `labels each party field with the kind it sends`() {
        assertEquals(
            listOf("Infantes a enviar", "Jinetes a enviar", "Arqueros a enviar"),
            listOf(UnitKind.Infantry, UnitKind.Cavalry, UnitKind.Archer).map { resources.partyFieldOf(it) },
        )
    }

    @Test
    fun `tallies the units at home`() {
        assertEquals("12 infantes en casa", resources.atHomeOf(UnitCount(UnitKind.Infantry, 12)))
    }

    @Test
    fun `reads a road under an hour in minutes and seconds`() {
        assertEquals("Camino de ida: 5:00", resources.roadLineOf(300.seconds))
    }

    @Test
    fun `reads a return past an hour in hours and minutes`() {
        assertEquals("Vuelta en 2 h 10 min", resources.returnLineOf(130.minutes))
    }

    @Test
    fun `reads a return of whole hours in hours`() {
        assertEquals("Vuelta en 2 h", resources.returnLineOf(120.minutes))
    }

    @Test
    fun `lists the loot`() {
        assertEquals(
            "Botín: 1\u2009200 de madera y 24 de comida",
            resources.lootLineOf(
                listOf(ResourceQuantity(ResourceKind.Wood, 1200), ResourceQuantity(ResourceKind.Food, 24)),
            ),
        )
    }

    @Test
    fun `reads each reason the send is blocked`() {
        assertEquals(
            listOf(
                "Ya hay una marcha en curso.",
                "Un número entero, 0 o más.",
                "Un número entero, de 1 a 8.",
                "Envía al menos un hombre.",
                "Necesitas 13 infantes en casa y tienes 12.",
            ),
            listOf(
                MapUiState.MarchBlock.MarchAway,
                MapUiState.MarchBlock.InvalidCount,
                MapUiState.MarchBlock.InvalidHours(maxStayHours = 8),
                MapUiState.MarchBlock.EmptyParty,
                MapUiState.MarchBlock.NotEnoughAtHome(UnitKind.Infantry, needed = 13, atHome = 12),
            ).map { resources.blockLineOf(it) },
        )
    }

    @Test
    fun `reads each refusal of the send as the web does`() {
        assertEquals(
            listOf(
                "El cuartel ya tiene una marcha en curso. Espera a que vuelva.",
                "Esa parcela no está en el mapa. Elige una que lo esté.",
                "Esa parcela ya tiene feudo. Elige una libre.",
                "Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.",
                "Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.",
                "Un colono no forrajea, no ataca ni lleva carga. Envíalo a fundar un feudo.",
                "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.",
            ),
            listOf(
                MarchRefusal.MarchSlotBusy,
                MarchRefusal.MarchTargetOutOfBounds,
                MarchRefusal.PlotHeld,
                MarchRefusal.PlotHasCamp,
                MarchRefusal.PlotReserved,
                MarchRefusal.UnitUnfitForOrder,
                MarchRefusal.Unrecognized,
            ).map { resources.refusalLineOf(it) },
        )
    }

    @Test
    fun `reads the march sent as it heads out`() {
        assertEquals(
            listOf(
                "Marcha de ida: 12 infantes y 1 jinete a provincia 3, parcela 7",
                "Vuelta en 1 h 10 min",
                "Botín: 15 de madera",
            ),
            resources.sentLinesOf(
                MapUiState.SentForage(
                    target = seventhPlot,
                    units = listOf(UnitCount(UnitKind.Infantry, 12), UnitCount(UnitKind.Cavalry, 1)),
                    returnIn = 70.minutes,
                    loot = listOf(ResourceQuantity(ResourceKind.Wood, 15)),
                ),
            ),
        )
    }

    @Test
    fun `names each order's action after its plot`() {
        assertEquals(
            listOf(
                "Atacar el campamento en parcela 7",
                "Fundar un feudo en parcela 7",
                "Enviar un transporte a parcela 7",
            ),
            listOf(MapUiState.OfferedOrder.Attack, MapUiState.OfferedOrder.Found, MapUiState.OfferedOrder.Transport)
                .map { resources.actionNameOf(it, 7) },
        )
    }

    @Test
    fun `proposes the plot's terrain, capitalized, as the new fief's name`() {
        assertEquals("Vega", resources.proposedNameOf(Terrain.Lowlands))
    }

    @Test
    fun `labels each cargo field with the resource it sends`() {
        assertEquals(
            listOf("Madera a enviar", "Piedra a enviar", "Hierro a enviar", "Oro a enviar", "Comida a enviar"),
            ResourceKind.entries.map { resources.cargoFieldOf(it) },
        )
    }

    @Test
    fun `reads the attack's preview in the web's order`() {
        val preview: MapUiState.AttackPreview = MapUiState.AttackPreview(
            road = 3.minutes,
            returnIn = 6.minutes,
            camp = MarchCamp(tier = 2, strength = 15),
            isWon = true,
            unitsLost = listOf(UnitCount(UnitKind.Infantry, 12), UnitCount(UnitKind.Cavalry, 0)),
            campLost = 15,
            survivors = listOf(UnitCount(UnitKind.Infantry, 8), UnitCount(UnitKind.Cavalry, 0)),
            loot = listOf(ResourceQuantity(ResourceKind.Wood, 128), ResourceQuantity(ResourceKind.Gold, 128)),
        )

        assertEquals(
            listOf(
                "Camino de ida: 3:00",
                "Vuelta en 6:00",
                "Campamento: nivel 2, fuerza 15",
                "Batalla: ganada",
                "Bajas: 12 infantes",
                "Bajas de los bandidos: 15",
                "Vuelven: 8 infantes",
                "Botín: 128 de madera y 128 de oro",
            ),
            resources.attackLinesOf(preview),
        )
    }

    @Test
    fun `reads a lost battle`() {
        val preview: MapUiState.AttackPreview = MapUiState.AttackPreview(
            road = 3.minutes,
            returnIn = 6.minutes,
            camp = MarchCamp(tier = 2, strength = 15),
            isWon = false,
            unitsLost = listOf(UnitCount(UnitKind.Infantry, 12)),
            campLost = 10,
            survivors = listOf(UnitCount(UnitKind.Infantry, 0)),
            loot = emptyList(),
        )

        assertEquals("Batalla: perdida", resources.attackLinesOf(preview)[3])
    }

    @Test
    fun `reads the founding's road and arrival`() {
        assertEquals(
            listOf("Camino de ida: 6:00", "Llegada en 6:00"),
            resources.foundingLinesOf(MapUiState.FoundingPreview(road = 6.minutes)),
        )
    }

    @Test
    fun `weighs the transport's cargo against the carry`() {
        assertEquals(
            "Carga: 300 de 600",
            resources.transportLinesOf(MapUiState.TransportPreview(cargo = 300, carry = 600, road = null)).single(),
        )
    }

    @Test
    fun `reads a cargo above the carry as the web's block`() {
        assertEquals(
            "La carga suma 721 y tus hombres llevan hasta 720.",
            resources.blockLineOf(MapUiState.MarchBlock.CargoAboveCarry(cargo = 721, carry = 720)),
        )
    }

    @Test
    fun `reads a single shortfall of one as falta and any other as faltan`() {
        assertEquals(
            listOf("Te falta 1 de madera.", "Te faltan 50 de madera.", "Te faltan 50 de madera y 20 de oro."),
            listOf(
                listOf(ResourceQuantity(ResourceKind.Wood, 1)),
                listOf(ResourceQuantity(ResourceKind.Wood, 50)),
                listOf(ResourceQuantity(ResourceKind.Wood, 50), ResourceQuantity(ResourceKind.Gold, 20)),
            ).map { resources.blockLineOf(MapUiState.MarchBlock.Shortfalls(it)) },
        )
    }

    @Test
    fun `reads the refusals of the new orders as the web does`() {
        assertEquals(
            listOf(
                "Esa parcela no tiene campamento de bandidos. Elige una que lo tenga.",
                "Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.",
                "Tu feudo necesita un nombre. Escribe uno que no esté en blanco.",
                "Un transporte no sale de vacío. Carga al menos un recurso.",
            ),
            listOf(
                MarchRefusal.PlotHasNoCamp,
                MarchRefusal.PlotReserved,
                MarchRefusal.BlankFiefName,
                MarchRefusal.EmptyCargo,
            ).map { resources.refusalLineOf(it) },
        )
    }

    @Test
    fun `reads each sent order under its heading`() {
        val infantry: List<UnitCount> = listOf(UnitCount(UnitKind.Infantry, 4))
        val settler: List<UnitCount> = listOf(UnitCount(UnitKind.Settler, 1))

        assertEquals(
            listOf(
                "Marcha al ataque: 4 infantes a provincia 3, parcela 7",
                "Marcha de fundación: 1 colono a provincia 3, parcela 7",
                "Marcha de transporte: 4 infantes a provincia 3, parcela 7",
            ),
            listOf(
                MapUiState.SentAttack(
                    seventhPlot,
                    infantry,
                    MarchCamp(tier = 1, strength = 10),
                    6.minutes,
                    emptyList(),
                ),
                MapUiState.SentFounding(seventhPlot, settler, "Vega", 3.minutes),
                MapUiState.SentTransport(
                    seventhPlot,
                    infantry,
                    listOf(ResourceQuantity(ResourceKind.Wood, 40)),
                    3.minutes,
                ),
            ).map { resources.sentLinesOf(it).first() },
        )
    }

    @Test
    fun `draws the api's line for a party short at home`() {
        assertEquals(
            "Necesitas 7 jinetes en casa y tienes 6. Ajusta la marcha.",
            resources.sendAnswerOf(
                MapUiState.SendStatus.RefusedWithApiLine("Necesitas 7 jinetes en casa y tienes 6. Ajusta la marcha."),
            ),
        )
    }

    private fun forageFormOn(target: PlotAddress): MapUiState.ForageForm = MapUiState.ForageForm(
        target = target,
        atHome = emptyList(),
        entries = emptyList(),
        hoursEntry = "1",
        maxStayHours = 8,
        isFieldLocked = false,
        preview = null,
        block = null,
        send = MapUiState.SendStatus.Idle,
    )
}
