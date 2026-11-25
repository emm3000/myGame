package com.emm.mygame.feature.learning.reviews

import kotlinx.coroutines.Job

internal data class ReviewReads(val reading: Job?, val rereading: Job?) {

    fun cancel() {
        reading?.cancel()
        rereading?.cancel()
    }

    companion object {
        val none: ReviewReads = ReviewReads(reading = null, rereading = null)
    }
}
