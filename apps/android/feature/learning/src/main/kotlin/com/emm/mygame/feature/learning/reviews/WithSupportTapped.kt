package com.emm.mygame.feature.learning.reviews

internal fun ReviewUiState.ReviewCard.withSupportTapped(spanIndex: Int): ReviewUiState.ReviewCard {
    val shown: Int? = if (openSpan == spanIndex) null else spanIndex
    return when (this) {
        is ReviewUiState.ReviewCard.Recognition -> copy(openSpan = shown)
        is ReviewUiState.ReviewCard.Recall -> copy(openSpan = shown)
    }
}
