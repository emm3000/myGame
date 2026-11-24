package com.emm.mygame.core.model.learning

import kotlin.time.Instant

data class DueReviews(
    val due: List<DueReview>,
    val readFirst: List<LessonId>,
    val nextDueAt: Instant?,
    val readAt: Instant,
)
