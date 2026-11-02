package com.emm.mygame.core.network

import kotlin.time.Instant

data class FiefSnapshot(
    val id: FiefId,
    val name: String,
    val readAt: Instant,
    val resources: List<StoredResource>,
    val slot: BuildSlot,
    val buildings: List<BuildingState>,
    val peasants: Peasants,
    val queue: BuildQueue,
)
