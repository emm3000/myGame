package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Instant

data class LevyDeliveryCase(
    val name: String,
    val startedAt: Instant,
    val perUnit: Duration,
    val count: Int,
    val at: Instant,
    val expectedDelivered: Int,
)
