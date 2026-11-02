package com.emm.mygame.core.network

data class ProvinceMap(
    val kingdom: Int,
    val province: Int,
    val lastProvince: Int,
    val terrain: Terrain,
    val plots: List<MapPlot>,
)
