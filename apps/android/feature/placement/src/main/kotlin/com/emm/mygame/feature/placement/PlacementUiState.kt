package com.emm.mygame.feature.placement

import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementItem
import com.emm.mygame.core.model.placement.PlacementScore

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
