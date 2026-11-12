package com.emm.mygame.feature.placement

sealed interface PlacementOfferUiState {

    data object Hidden : PlacementOfferUiState

    data object Offered : PlacementOfferUiState

    data object Asking : PlacementOfferUiState
}
