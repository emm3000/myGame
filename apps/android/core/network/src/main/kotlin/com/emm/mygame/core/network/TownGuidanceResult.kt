package com.emm.mygame.core.network

sealed interface TownGuidanceResult {

    data object Marked : TownGuidanceResult

    data object Unreachable : TownGuidanceResult
}
