package com.emm.mygame.core.model.town.guidance

sealed interface TownGuidanceResult {

    data object Marked : TownGuidanceResult

    data object Unreachable : TownGuidanceResult
}
