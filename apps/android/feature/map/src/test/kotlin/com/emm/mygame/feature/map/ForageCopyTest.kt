package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
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
class ForageCopyTest {

    private val resources: Resources = RuntimeEnvironment.getApplication().resources

    private val seventhPlot: PlotAddress = PlotAddress(province = 3, plot = 7)

    @Test
    fun `names the march action after its plot`() {
        assertEquals("Enviar una marcha a parcela 7", resources.forageActionNameOf(7))
    }

    @Test
    fun `titles the form with the province and the plot`() {
        assertEquals("Marcha a provincia 3, parcela 7", resources.forageTitleOf(seventhPlot))
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
                MapUiState.ForageBlock.MarchAway,
                MapUiState.ForageBlock.InvalidCount,
                MapUiState.ForageBlock.InvalidHours(maxStayHours = 8),
                MapUiState.ForageBlock.EmptyParty,
                MapUiState.ForageBlock.NotEnoughAtHome(UnitKind.Infantry, needed = 13, atHome = 12),
            ).map { resources.blockLineOf(it) },
        )
    }

    @Test
    fun `reads each refusal of the send as the web does`() {
        assertEquals(
            listOf(
                "No tienes en casa los hombres que pide esa marcha. Ajusta la marcha.",
                "El cuartel ya tiene una marcha en curso. Espera a que vuelva.",
                "Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.",
                "Esa parcela no está en el mapa. Elige una que lo esté.",
                "Esa parcela ya tiene feudo. Elige una libre.",
                "Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.",
                "Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.",
                "Un colono no forrajea, no ataca ni lleva carga. Envíalo a fundar un feudo.",
                "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.",
            ),
            listOf(
                MarchRefusal.NotEnoughUnitsAtHome,
                MarchRefusal.MarchSlotBusy,
                MarchRefusal.StayOutOfRange,
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
}
