package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.RegionMapSitesInner
import com.emm.mygame.core.network.generated.models.RegionMapSitesInnerTown
import com.emm.mygame.core.network.generated.models.RegionMapSitesInnerWaste
import retrofit2.Response
import com.emm.mygame.core.network.generated.models.RegionMap as WireRegionMap
import com.emm.mygame.core.network.generated.models.WasteSize as WireWasteSize

private const val MALFORMED_PATH: Int = 400

internal fun regionMapResultOf(response: Response<WireRegionMap>): RegionMapResult {
    if (response.isSuccessful) {
        val map: RegionMap? = response.body()?.toRegionMap()
        return if (map == null) RegionMapResult.Unreachable else RegionMapResult.Read(map)
    }
    if (response.code() == MALFORMED_PATH) return RegionMapResult.AreaNotFound
    return when (response.wireRefusal()?.bareKind()) {
        BareApiError.Kind.AreaNotFound -> RegionMapResult.AreaNotFound
        BareApiError.Kind.TownNotFound -> RegionMapResult.NoTown
        else -> RegionMapResult.Unreachable
    }
}

private fun WireRegionMap.toRegionMap(): RegionMap? {
    val areaTerrain: Terrain = terrain.toTerrain() ?: return null
    return RegionMap(
        region = region,
        area = area,
        lastArea = lastArea,
        terrain = areaTerrain,
        sites = sites.map { site: RegionMapSitesInner -> site.toSite() ?: return null },
    )
}

private fun RegionMapSitesInner.toSite(): RegionMap.Site? {
    val wire: RegionMapSitesInnerWaste = waste ?: return RegionMap.Site(site, town?.toSiteTown(), waste = null)
    val size: WasteSize = wire.propertySize.toWasteSize() ?: return null
    return RegionMap.Site(site, town?.toSiteTown(), waste = RegionMap.SiteWaste(size = size, waste = wire.waste))
}

private fun RegionMapSitesInnerTown.toSiteTown(): RegionMap.SiteTown = RegionMap.SiteTown(name = name, isOwn = isOwn)

private fun WireRegionMap.Terrain.toTerrain(): Terrain? = when (this) {
    WireRegionMap.Terrain.fields -> Terrain.Fields
    WireRegionMap.Terrain.river -> Terrain.River
    WireRegionMap.Terrain.hills -> Terrain.Hills
    WireRegionMap.Terrain.unknown_default_open_api -> null
}

internal fun WireWasteSize.toWasteSize(): WasteSize? = when (this) {
    WireWasteSize._1 -> WasteSize.Small
    WireWasteSize._2 -> WasteSize.Medium
    WireWasteSize._3 -> WasteSize.Large
    WireWasteSize.unknown_default_open_api -> null
}
