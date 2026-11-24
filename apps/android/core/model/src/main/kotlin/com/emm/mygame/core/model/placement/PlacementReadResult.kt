package com.emm.mygame.core.model.placement

sealed interface PlacementReadResult {

    data class Read(val placement: Placement) : PlacementReadResult

    data object Unreachable : PlacementReadResult
}
