package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.LessonId
import kotlin.time.Duration

internal data class ReviewServerView(
    val gap: Duration,
    val readFirstOnArrival: List<LessonId>?,
    val reread: DueReviews?,
) {

    companion object {
        val none: ReviewServerView = ReviewServerView(gap = Duration.ZERO, readFirstOnArrival = null, reread = null)
    }
}
