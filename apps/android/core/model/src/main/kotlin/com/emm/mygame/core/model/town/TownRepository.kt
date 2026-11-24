package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.model.town.guidance.TownGuidanceRepository
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.core.model.town.jobs.RegionRepository
import com.emm.mygame.core.model.town.school.TownLessonResult
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
