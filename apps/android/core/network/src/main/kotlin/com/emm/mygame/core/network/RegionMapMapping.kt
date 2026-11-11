package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.RegionMapSitesInner
import com.emm.mygame.core.network.generated.models.RegionMapSitesInnerTown
import retrofit2.Response
import com.emm.mygame.core.network.generated.models.RegionMap as WireRegionMap

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
        sites = sites.map(RegionMapSitesInner::toSite),
    )
}

private fun RegionMapSitesInner.toSite(): RegionMap.Site = RegionMap.Site(site = site, town = town?.toSiteTown())

private fun RegionMapSitesInnerTown.toSiteTown(): RegionMap.SiteTown = RegionMap.SiteTown(name = name, isOwn = isOwn)

private fun WireRegionMap.Terrain.toTerrain(): Terrain? = when (this) {
    WireRegionMap.Terrain.fields -> Terrain.Fields
    WireRegionMap.Terrain.river -> Terrain.River
    WireRegionMap.Terrain.hills -> Terrain.Hills
    WireRegionMap.Terrain.unknown_default_open_api -> null
}
