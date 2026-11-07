package com.emm.mygame.core.network

import kotlin.time.Instant

data class DueReviews(
    val due: List<DueReview>,
    val readFirst: List<LessonId>,
    val nextDueAt: Instant?,
    val readAt: Instant,
)
