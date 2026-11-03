package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FiefListFiefsInner
import com.emm.mygame.core.network.generated.models.ProvinceMapPlotsInner
import com.emm.mygame.core.network.generated.models.ProvinceMapPlotsInnerCamp
import com.emm.mygame.core.network.generated.models.ProvinceMapPlotsInnerFief
import com.emm.mygame.core.network.generated.models.ProvinceMap as ProvinceMapBody

internal fun ProvinceMapBody.toProvinceMap(lordsFiefs: List<FiefListFiefsInner>): ProvinceMap? {
    val known: Terrain = terrain.toTerrain() ?: return null
    val mapped: List<MapPlot> = plots.map { plot: ProvinceMapPlotsInner ->
        plot.toMapPlot(ownFiefAt = { number: Int -> lordsFiefs.idAt(kingdom, province, number) }) ?: return null
    }
    return ProvinceMap(
        kingdom = kingdom,
        province = province,
        lastProvince = lastProvince,
        terrain = known,
        plots = mapped,
    )
}

private fun ProvinceMapBody.Terrain.toTerrain(): Terrain? = when (this) {
    ProvinceMapBody.Terrain.lowlands -> Terrain.Lowlands
    ProvinceMapBody.Terrain.uplands -> Terrain.Uplands
    ProvinceMapBody.Terrain.ridges -> Terrain.Ridges
    ProvinceMapBody.Terrain.unknown_default_open_api -> null
}

private fun List<FiefListFiefsInner>.idAt(kingdom: Int, province: Int, plot: Int): FiefId? = firstOrNull { listed ->
    listed.coordinates.kingdom == kingdom && listed.coordinates.province == province && listed.coordinates.plot == plot
}?.let { listed: FiefListFiefsInner -> FiefId(listed.id.toString()) }

private fun ProvinceMapPlotsInner.toMapPlot(ownFiefAt: (Int) -> FiefId?): MapPlot? {
    val holder: PlotHolder = holderOf(ownFiefAt) ?: return null
    return MapPlot(plot = plot, holder = holder)
}

private fun ProvinceMapPlotsInner.holderOf(ownFiefAt: (Int) -> FiefId?): PlotHolder? {
    val lord: ProvinceMapPlotsInnerFief? = fief
    return when {
        lord != null -> if (lord.isOwn) PlotHolder.Own(lord.name, ownFiefAt(plot)) else PlotHolder.Held(lord.name)
        reservation != null -> PlotHolder.Reserved(isOwn = reservation.isOwn)
        camp != null -> camp.toCamp()
        else -> PlotHolder.Free
    }
}

private fun ProvinceMapPlotsInnerCamp.toCamp(): PlotHolder? = when (tier) {
    ProvinceMapPlotsInnerCamp.Tier._1,
    ProvinceMapPlotsInnerCamp.Tier._2,
    ProvinceMapPlotsInnerCamp.Tier._3,
    -> PlotHolder.Camp(tier = tier.value, strength = strength)
    ProvinceMapPlotsInnerCamp.Tier.unknown_default_open_api -> null
}
