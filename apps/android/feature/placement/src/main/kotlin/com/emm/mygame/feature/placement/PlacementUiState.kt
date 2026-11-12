package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.network.WordId

sealed interface PlacementUiState {

    data object Loading : PlacementUiState

    data object Failed : PlacementUiState

    data class Offered(val request: PlacementRequest) : PlacementUiState

    data class Asking(
        val band: PlacementBand,
        val items: List<PlacementItem>,
        val scores: List<PlacementScore>,
        val shownIndex: Int,
        val chosen: Map<WordId, ChoiceId>,
        val request: PlacementRequest,
    ) : PlacementUiState {

        val shown: PlacementItem
            get() = items[shownIndex]

        val chosenForShown: ChoiceId?
            get() = chosen[shown.word]

        val isLastShown: Boolean
            get() = shownIndex == items.lastIndex
    }

    data class Closed(val scores: List<PlacementScore>) : PlacementUiState
}
