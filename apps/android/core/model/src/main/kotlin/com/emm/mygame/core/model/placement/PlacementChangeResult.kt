package com.emm.mygame.core.model.placement

sealed interface PlacementChangeResult {

    data class Changed(val placement: Placement) : PlacementChangeResult

    data object Refused : PlacementChangeResult

    data object Unreachable : PlacementChangeResult
}
