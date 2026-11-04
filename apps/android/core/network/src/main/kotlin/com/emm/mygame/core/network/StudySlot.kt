package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface StudySlot {

    data object Idle : StudySlot

    data class Busy(
        val art: ArtKind,
        val targetLevel: Int,
        val finishesAt: Instant,
        val cost: List<ResourceCost>,
    ) : StudySlot

    data class Lesson(val lesson: LessonId, val finishesAt: Instant) : StudySlot
}
