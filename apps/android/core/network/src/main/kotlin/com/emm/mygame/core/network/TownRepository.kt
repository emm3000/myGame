package com.emm.mygame.core.network

import kotlin.time.Instant
import kotlinx.coroutines.flow.StateFlow

interface TownRepository :
    RegionRepository,
    TownGuidanceRepository {

    val town: StateFlow<HeldTown?>

    suspend fun read(): TownReadResult

    suspend fun readSentAfterNow(): TownReadResult

    suspend fun found(name: String): TownFoundResult

    suspend fun startWork(building: TownBuildingKind): TownWorkResult

    suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult

    suspend fun startLesson(lesson: LessonId): TownLessonResult

    suspend fun stopLesson(lesson: LessonId): TownLessonResult

    suspend fun placeHiring(hire: TownHireKind, count: Int): TownHiringResult

    suspend fun stopHiring(hire: TownHireKind, startedAt: Instant): TownHiringResult
}
