package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.ReviewVerdict

internal fun ReviewUiState.ReviewCard.correctFormOf(verdict: ReviewVerdict.Wrong): String = when (this) {
    is ReviewUiState.ReviewCard.Recognition -> verdict.gloss
    is ReviewUiState.ReviewCard.Recall -> verdict.word
}
