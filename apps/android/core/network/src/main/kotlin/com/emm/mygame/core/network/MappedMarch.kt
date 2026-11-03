package com.emm.mygame.core.network

internal data class MappedMarch(
    val coordinates: PlotAddress,
    val march: AwayMarch?,
    val forageTerms: ForageTerms,
    val season: SeasonPercents?,
)
