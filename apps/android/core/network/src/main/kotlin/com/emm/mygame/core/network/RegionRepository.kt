package com.emm.mygame.core.network

import kotlin.time.Instant

interface RegionRepository {

    suspend fun readMap(area: Int?): RegionMapResult

    suspend fun sendJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): TownJobResult

    suspend fun callJobBack(sentAt: Instant): TownJobResult
}
