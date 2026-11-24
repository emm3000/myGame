package com.emm.mygame.core.model.town

const val UNSCALED_PERCENT: Int = 100

data class SeasonInForce(
    val kind: SeasonKind,
    val year: Int,
    val productionPercent: SeasonProductionPercent,
    val durationPercent: SeasonDurationPercent,
)
