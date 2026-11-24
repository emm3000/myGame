package com.emm.mygame.feature.town

import kotlin.time.Duration

internal fun TownUiState.nearestReadyLeft(): Duration? {
    if (this !is TownUiState.Content) return null
    val places: List<TownUiState.ReadyTime> = places.mapNotNull { place: TownUiState.PlaceCard ->
        (place.block as? TownUiState.BlockReason.Resources)?.ready
    }
    val hires: List<TownUiState.ReadyTime> = hiring.hires.mapNotNull { card: TownUiState.HiringCard ->
        (card.form?.block as? TownUiState.HiringBlock.Resources)?.ready
    }
    return (places + hires)
        .map(TownUiState.ReadyTime::remaining)
        .filter { left: Duration -> left > Duration.ZERO }
        .minOrNull()
}
