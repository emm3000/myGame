package com.emm.mygame.core.network

sealed interface ReviewsReadResult {

    data class Read(val reviews: DueReviews) : ReviewsReadResult

    data object Unreachable : ReviewsReadResult
}
