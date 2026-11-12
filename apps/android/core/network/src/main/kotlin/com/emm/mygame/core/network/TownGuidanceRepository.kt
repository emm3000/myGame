package com.emm.mygame.core.network

interface TownGuidanceRepository {

    suspend fun markTipSeen(tip: TipKind): TownGuidanceResult

    suspend fun dismissGuidance(): TownGuidanceResult
}
