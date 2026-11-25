package com.emm.mygame.feature.learning.reviews

import kotlinx.coroutines.Job

internal data class ReviewReads(val reading: Job?, val waiting: Job?) {

    fun cancel() {
        reading?.cancel()
        waiting?.cancel()
    }

    companion object {
        val none: ReviewReads = ReviewReads(reading = null, waiting = null)
    }
}
