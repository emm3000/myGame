package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Instant

data class MarchPhaseCase(
    val name: String,
    val arrivesAt: Instant,
    val leavesAt: Instant,
    val at: Instant,
    val expectedPhase: MarchPhase,
    val expectedNextTurn: Duration?,
)
