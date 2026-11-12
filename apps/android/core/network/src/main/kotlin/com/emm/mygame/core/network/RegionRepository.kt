package com.emm.mygame.core.network

import kotlin.time.Instant

interface RegionRepository : RegionReader {

    suspend fun sendJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): TownJobResult

    suspend fun sendCleanUp(target: JobTarget, team: Map<TownHireKind, Int>): TownJobResult

    suspend fun callJobBack(sentAt: Instant): TownJobResult
}
