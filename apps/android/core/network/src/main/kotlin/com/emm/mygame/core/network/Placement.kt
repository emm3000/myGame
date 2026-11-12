package com.emm.mygame.core.network

sealed interface Placement {

    data object Offered : Placement

    data class Asking(
        val band: PlacementBand,
        val items: List<PlacementItem>,
        val scores: List<PlacementScore>,
    ) : Placement

    data class Closed(val scores: List<PlacementScore>) : Placement
}
