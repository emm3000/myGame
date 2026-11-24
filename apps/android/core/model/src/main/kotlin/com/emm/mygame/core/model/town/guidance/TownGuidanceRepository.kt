package com.emm.mygame.core.model.town.guidance

interface TownGuidanceRepository {

    suspend fun markTipSeen(tip: TipKind): TownGuidanceResult

    suspend fun dismissGuidance(): TownGuidanceResult
}
