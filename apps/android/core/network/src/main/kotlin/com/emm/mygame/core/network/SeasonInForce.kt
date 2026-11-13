package com.emm.mygame.core.network

const val UNSCALED_PERCENT: Int = 100

data class SeasonInForce(
    val kind: SeasonKind,
    val year: Int,
    val productionPercents: Map<TownResourceKind, Int>,
    val durationPercent: SeasonDurationPercent,
)

data class SeasonDurationPercent(val build: Int, val study: Int, val hire: Int, val road: Int)
