package com.emm.mygame.core.network

import kotlin.time.Duration

data class NextArtLevel(
    val level: Int,
    val cost: List<ResourceCost>,
    val duration: Duration,
    val requiredLibraryLevel: Int,
    val ratePercent: Double,
)
