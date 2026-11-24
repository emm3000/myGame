package com.emm.mygame.feature.town

import com.emm.mygame.feature.town.building.BlockReason
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.hiring.HiringBlock
import com.emm.mygame.feature.town.hiring.HiringCard
import kotlin.time.Duration

internal fun TownUiState.nearestReadyLeft(): Duration? {
    if (this !is TownUiState.Content) return null
    val places: List<ReadyTime> = places.mapNotNull { place: PlaceCard ->
        (place.block as? BlockReason.Resources)?.ready
    }
    val hires: List<ReadyTime> = hiring.hires.mapNotNull { card: HiringCard ->
        (card.form?.block as? HiringBlock.Resources)?.ready
    }
    return (places + hires)
        .map(ReadyTime::remaining)
        .filter { left: Duration -> left > Duration.ZERO }
        .minOrNull()
}
