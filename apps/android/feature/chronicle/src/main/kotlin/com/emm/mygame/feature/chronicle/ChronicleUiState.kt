package com.emm.mygame.feature.chronicle

import com.emm.mygame.core.network.ChronicleEvent
import kotlin.time.Instant

sealed interface ChronicleUiState {

    data object Loading : ChronicleUiState

    data object Failed : ChronicleUiState

    data object Empty : ChronicleUiState

    data class Content(val events: List<ChronicleEvent>, val readAt: Instant) : ChronicleUiState
}
