package com.emm.mygame.feature.placement

sealed interface PlacementRequest {

    data object Idle : PlacementRequest

    data class Waiting(val action: PlacementAction) : PlacementRequest

    data object Unreachable : PlacementRequest
}
