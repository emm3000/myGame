package com.emm.mygame.core.model.learning

sealed interface ReviewsReadResult {

    data class Read(val reviews: DueReviews) : ReviewsReadResult

    data object Unreachable : ReviewsReadResult
}
