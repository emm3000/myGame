package com.emm.mygame.feature.learning.reviews

internal fun ReviewUiState.ReviewCard.sentAnswer(): String? = when (this) {
    is ReviewUiState.ReviewCard.Recognition -> chosen?.value
    is ReviewUiState.ReviewCard.Recall -> typed.ifEmpty { null }
}
