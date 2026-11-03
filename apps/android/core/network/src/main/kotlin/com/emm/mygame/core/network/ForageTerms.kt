package com.emm.mygame.core.network

data class ForageTerms(
    val secondsPerProvince: Int,
    val secondsPerPlot: Int,
    val maxStayHours: Int,
    val yieldPerHour: Map<Terrain, List<ResourceQuantity>>,
)
