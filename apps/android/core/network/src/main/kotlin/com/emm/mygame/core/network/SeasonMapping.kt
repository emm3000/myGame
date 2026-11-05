package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FiefOverviewSeason

internal fun FiefOverviewSeason.toSeasonInForce(): SeasonInForce? {
    val seasonKind: SeasonKind = kind.toSeasonKind() ?: return null
    return SeasonInForce(kind = seasonKind, year = year)
}

private fun FiefOverviewSeason.Kind.toSeasonKind(): SeasonKind? = when (this) {
    FiefOverviewSeason.Kind.spring -> SeasonKind.Spring
    FiefOverviewSeason.Kind.summer -> SeasonKind.Summer
    FiefOverviewSeason.Kind.fall -> SeasonKind.Fall
    FiefOverviewSeason.Kind.winter -> SeasonKind.Winter
    FiefOverviewSeason.Kind.unknown_default_open_api -> null
}
