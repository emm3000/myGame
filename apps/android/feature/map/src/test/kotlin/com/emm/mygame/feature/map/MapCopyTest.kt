package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.Terrain
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class MapCopyTest {

    private val resources: Resources = RuntimeEnvironment.getApplication().resources

    @Test
    fun `heads the province with the kingdom's name`() {
        assertEquals("Vadoalto, provincia 3", resources.headingOf(provinceOf(kingdom = 1)))
    }

    @Test
    fun `heads a province of an unnamed kingdom with its number`() {
        assertEquals("2, provincia 3", resources.headingOf(provinceOf(kingdom = 2)))
    }

    @Test
    fun `names the lowlands as the vega`() {
        assertEquals("Terreno: vega", resources.terrainLineOf(Terrain.Lowlands))
    }

    @Test
    fun `names the uplands as the paramo`() {
        assertEquals("Terreno: páramo", resources.terrainLineOf(Terrain.Uplands))
    }

    @Test
    fun `names the ridges as the riscos`() {
        assertEquals("Terreno: riscos", resources.terrainLineOf(Terrain.Ridges))
    }

    @Test
    fun `reads a free plot as libre`() {
        assertEquals(listOf("Parcela 7: libre"), resources.plotLinesOf(MapPlot(7, PlotHolder.Free)))
    }

    @Test
    fun `reads a held plot by its fief's name`() {
        assertEquals(
            listOf("Parcela 12: Sotoverde"),
            resources.plotLinesOf(MapPlot(12, PlotHolder.Held(name = "Sotoverde"))),
        )
    }

    @Test
    fun `reads the own fief under the plot with its marker`() {
        assertEquals(
            listOf("Parcela 12", "Tu feudo: Sotoverde"),
            resources.plotLinesOf(MapPlot(12, PlotHolder.Own(name = "Sotoverde", fief = null))),
        )
    }

    @Test
    fun `reads a camp with its tier and strength`() {
        assertEquals(
            listOf("Parcela 7: campamento de bandidos, nivel 2, fuerza 15"),
            resources.plotLinesOf(MapPlot(7, PlotHolder.Camp(tier = 2, strength = 15))),
        )
    }

    @Test
    fun `reads another lord's founding as reservada`() {
        assertEquals(
            listOf("Parcela 7: reservada"),
            resources.plotLinesOf(MapPlot(7, PlotHolder.Reserved(isOwn = false))),
        )
    }

    @Test
    fun `marks the own founding on a reserved plot`() {
        assertEquals(
            listOf("Parcela 7: reservada · Tu fundación"),
            resources.plotLinesOf(MapPlot(7, PlotHolder.Reserved(isOwn = true))),
        )
    }

    private fun provinceOf(kingdom: Int): ProvinceMap = ProvinceMap(
        kingdom = kingdom,
        province = 3,
        lastProvince = 9,
        terrain = Terrain.Lowlands,
        plots = emptyList(),
    )
}
