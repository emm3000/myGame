package com.emm.mygame.feature.learning.reviews

internal fun ReviewUiState.Reviewing.goIntent(): ReviewIntent =
    if (isRated) ReviewIntent.NextTapped else ReviewIntent.CheckTapped
