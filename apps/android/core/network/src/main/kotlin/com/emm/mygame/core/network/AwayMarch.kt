package com.emm.mygame.core.network

import kotlin.time.Instant

data class AwayMarch(
    val order: MarchOrder,
    val target: PlotAddress,
    val units: List<UnitCount>,
    val departedAt: Instant,
    val arrivesAt: Instant,
    val leavesAt: Instant,
    val returnsAt: Instant,
    val recalledAt: Instant?,
    val loot: List<ResourceQuantity>,
)
