package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.WordId

sealed interface HoldoutCheckUiState {

    data object Loading : HoldoutCheckUiState

    data object Failed : HoldoutCheckUiState

    data object NotOpen : HoldoutCheckUiState

    data class Due(
        val band: PlacementBand,
        val week: HoldoutCheckWeek,
        val request: HoldoutCheckRequest,
    ) : HoldoutCheckUiState

    data class Asking(
        val band: PlacementBand,
        val week: HoldoutCheckWeek,
        val items: List<PlacementItem>,
        val shownIndex: Int,
        val chosen: Map<WordId, ChoiceId>,
        val request: HoldoutCheckRequest,
    ) : HoldoutCheckUiState {

        val shown: PlacementItem?
            get() = items.getOrNull(shownIndex)

        val chosenForShown: ChoiceId?
            get() = shown?.let { item: PlacementItem -> chosen[item.word] }

        val isLastShown: Boolean
            get() = shownIndex >= items.lastIndex
    }

    data object Answered : HoldoutCheckUiState

    data object Skipped : HoldoutCheckUiState
}
