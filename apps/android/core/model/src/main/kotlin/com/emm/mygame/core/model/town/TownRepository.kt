package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.building.TownWorkRepository
import com.emm.mygame.core.model.town.guidance.TownGuidanceRepository
import com.emm.mygame.core.model.town.hiring.TownHiringRepository
import com.emm.mygame.core.model.town.jobs.TownRegionRepository
import com.emm.mygame.core.model.town.school.TownLessonResult

interface TownRepository :
    TownRegionRepository,
    TownFoundingRepository,
    TownWorkRepository,
    TownHiringRepository,
    TownGuidanceRepository {

    suspend fun readSentAfterNow(): TownReadResult

    suspend fun startLesson(lesson: LessonId): TownLessonResult

    suspend fun stopLesson(lesson: LessonId): TownLessonResult
}
