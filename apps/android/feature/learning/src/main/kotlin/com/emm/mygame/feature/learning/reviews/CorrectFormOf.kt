package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.ReviewVerdict

internal fun correctFormOf(card: ReviewUiState.ReviewCard, verdict: ReviewVerdict.Wrong): String = when (card) {
    is ReviewUiState.ReviewCard.Recognition -> verdict.gloss
    is ReviewUiState.ReviewCard.Recall -> verdict.word
}
