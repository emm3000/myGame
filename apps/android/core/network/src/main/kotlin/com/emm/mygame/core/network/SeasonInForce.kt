package com.emm.mygame.core.network

const val UNSCALED_PERCENT: Int = 100

data class SeasonInForce(
    val kind: SeasonKind,
    val year: Int,
    val productionPercent: SeasonProductionPercent,
    val durationPercent: SeasonDurationPercent,
)

data class SeasonProductionPercent(val money: Int, val food: Int, val power: Int, val material: Int) {

    fun of(resource: TownResourceKind): Int = when (resource) {
        TownResourceKind.Money -> money
        TownResourceKind.Food -> food
        TownResourceKind.Power -> power
        TownResourceKind.Material -> material
    }
}

data class SeasonDurationPercent(val build: Int, val study: Int, val hire: Int, val road: Int)
