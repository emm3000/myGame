package com.emm.mygame.feature.map

import android.content.res.Resources
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.Terrain

internal fun Resources.headingOf(map: ProvinceMap): String =
    getString(R.string.map_heading, kingdomLabelOf(map.kingdom), map.province)

internal fun Resources.terrainLineOf(terrain: Terrain): String = getString(R.string.map_terrain, terrainOf(terrain))

internal fun Resources.terrainOf(terrain: Terrain): String = getString(
    when (terrain) {
        Terrain.Lowlands -> R.string.terrain_lowlands
        Terrain.Uplands -> R.string.terrain_uplands
        Terrain.Ridges -> R.string.terrain_ridges
    },
)

internal fun Resources.plotLinesOf(plot: MapPlot): List<String> = when (val holder: PlotHolder = plot.holder) {
    PlotHolder.Free -> listOf(getString(R.string.map_plot_free, plot.plot))
    is PlotHolder.Held -> listOf(getString(R.string.map_plot_held, plot.plot, holder.name))
    is PlotHolder.Own -> listOf(
        getString(R.string.map_plot, plot.plot),
        getString(R.string.map_plot_own_fief, holder.name),
    )
    is PlotHolder.Camp -> listOf(getString(R.string.map_plot_camp, plot.plot, holder.tier, holder.strength))
    is PlotHolder.Reserved -> listOf(
        getString(if (holder.isOwn) R.string.map_plot_own_founding else R.string.map_plot_reserved, plot.plot),
    )
}

private fun Resources.kingdomLabelOf(kingdom: Int): String = when (kingdom) {
    VADOALTO -> getString(R.string.map_kingdom_vadoalto)
    else -> kingdom.toString()
}

private const val VADOALTO: Int = 1
