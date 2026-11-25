package com.emm.mygame.core.model.town.hiring

import kotlin.time.Instant

interface TownHiringRepository {

    suspend fun placeHiring(hire: TownHireKind, count: Int): TownHiringResult

    suspend fun stopHiring(hire: TownHireKind, startedAt: Instant): TownHiringResult
}
