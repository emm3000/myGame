package com.emm.mygame.core.network

interface RegionReader {

    suspend fun readMap(area: Int?): RegionMapResult

    suspend fun quoteJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): JobQuoteResult

    suspend fun quoteCleanUp(target: JobTarget, team: Map<TownHireKind, Int>): CleanUpQuoteResult
}
