package com.emm.mygame.core.network

import kotlin.time.Instant

data class TownReport(
    val dueCount: Int,
    val readFirst: List<LessonId>,
    val nextDueAt: Instant?,
    val news: List<TownNews>,
)
