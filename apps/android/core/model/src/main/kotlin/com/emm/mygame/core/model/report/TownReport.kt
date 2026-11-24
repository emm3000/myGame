package com.emm.mygame.core.model.report

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.news.TownNews
import kotlin.time.Instant

data class TownReport(
    val dueCount: Int,
    val readFirst: List<LessonId>,
    val nextDueAt: Instant?,
    val news: List<TownNews>,
    val readAt: Instant,
)
