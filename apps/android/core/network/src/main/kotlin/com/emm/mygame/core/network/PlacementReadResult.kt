package com.emm.mygame.core.network

sealed interface PlacementReadResult {

    data class Read(val placement: Placement) : PlacementReadResult

    data object Unreachable : PlacementReadResult
}
