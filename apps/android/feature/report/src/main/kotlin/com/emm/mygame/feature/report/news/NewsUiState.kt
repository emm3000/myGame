package com.emm.mygame.feature.report.news

import com.emm.mygame.core.model.town.news.TownNews
import kotlin.time.Instant

sealed interface NewsUiState {

    data object Loading : NewsUiState

    data object Failed : NewsUiState

    data class Content(val news: List<TownNews>, val receivedAt: Instant) : NewsUiState
}
