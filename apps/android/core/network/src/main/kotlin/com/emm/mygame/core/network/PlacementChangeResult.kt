package com.emm.mygame.core.network

sealed interface PlacementChangeResult {

    data class Changed(val placement: Placement) : PlacementChangeResult

    data object Refused : PlacementChangeResult

    data object Unreachable : PlacementChangeResult
}
