package com.emm.mygame.core.network

data class RegionMap(
    val region: Int,
    val area: Int,
    val lastArea: Int,
    val terrain: Terrain,
    val sites: List<RegionMap.Site>,
) {

    data class Site(val site: Int, val town: SiteTown?)

    data class SiteTown(val name: String, val isOwn: Boolean)
}
