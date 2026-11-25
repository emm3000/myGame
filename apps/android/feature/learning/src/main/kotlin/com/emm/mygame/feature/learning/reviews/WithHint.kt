package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.ReviewHint

internal fun ReviewUiState.ReviewCard.withHint(hint: ReviewHint): ReviewUiState.ReviewCard = when (this) {
    is ReviewUiState.ReviewCard.Recognition -> this
    is ReviewUiState.ReviewCard.Recall -> copy(hint = hint)
}
