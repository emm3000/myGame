package com.emm.mygame.feature.report

import com.emm.mygame.core.network.TownNews
import kotlin.time.Instant

sealed interface NewsUiState {

    data object Loading : NewsUiState

    data object Failed : NewsUiState

    data class Content(val news: List<TownNews>, val receivedAt: Instant) : NewsUiState
}
