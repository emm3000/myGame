package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.DueReview

internal fun reviewCardOf(review: DueReview): ReviewUiState.ReviewCard = when (review) {
    is DueReview.Recognition -> ReviewUiState.ReviewCard.Recognition(
        wordId = review.wordId,
        word = review.word,
        frame = review.frame,
        choices = review.choices,
        chosen = null,
        openSpan = null,
    )
    is DueReview.Recall -> ReviewUiState.ReviewCard.Recall(
        wordId = review.wordId,
        gloss = review.gloss,
        gappedFrame = review.gappedFrame,
        typed = "",
        hint = null,
        openSpan = null,
    )
}
