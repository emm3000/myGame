package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.ui.getIcuString

internal fun Resources.headingOf(map: ProvinceMap): String =
    getIcuString(R.string.map_heading, "kingdom" to kingdomLabelOf(map.kingdom), "province" to map.province.toString())

internal fun Resources.terrainLineOf(terrain: Terrain): String = getIcuString(
    R.string.map_terrain,
    "terrain" to terrainOf(terrain),
)

internal fun Resources.terrainOf(terrain: Terrain): String = getString(
    when (terrain) {
        Terrain.Lowlands -> R.string.terrain_lowlands
        Terrain.Uplands -> R.string.terrain_uplands
        Terrain.Ridges -> R.string.terrain_ridges
    },
)

internal fun Resources.plotLinesOf(plot: MapPlot): List<String> = when (val holder: PlotHolder = plot.holder) {
    PlotHolder.Free -> listOf(getIcuString(R.string.map_plot_free, "plot" to plot.plot.toString()))
    is PlotHolder.Held -> listOf(
        getIcuString(R.string.map_plot_held, "plot" to plot.plot.toString(), "name" to holder.name),
    )
    is PlotHolder.Own -> listOf(
        getIcuString(R.string.map_plot, "plot" to plot.plot.toString()),
        getIcuString(R.string.map_plot_own_fief, "name" to holder.name),
    )
    is PlotHolder.Camp -> listOf(
        getIcuString(
            R.string.map_plot_camp,
            "plot" to plot.plot.toString(),
            "tier" to holder.tier.toString(),
            "strength" to holder.strength.toString(),
        ),
    )
    is PlotHolder.Reserved -> listOf(
        getIcuString(
            if (holder.isOwn) R.string.map_plot_own_founding else R.string.map_plot_reserved,
            "plot" to plot.plot.toString(),
        ),
    )
}

private fun Resources.kingdomLabelOf(kingdom: Int): String = when (kingdom) {
    VADOALTO -> getString(R.string.map_kingdom_vadoalto)
    else -> kingdom.toString()
}

private const val VADOALTO: Int = 1
