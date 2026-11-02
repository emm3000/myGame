package com.emm.mygame.core.network

import kotlin.time.Instant

data class FiefSnapshot(
    val name: String,
    val readAt: Instant,
    val resources: List<StoredResource>,
    val slot: BuildSlot,
)
