package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.hiring.TownHireKind
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface HiringOrderLine {

    data object Idle : HiringOrderLine

    data class Busy(
        val target: HiringTarget,
        val count: Int,
        val delivered: Int,
        val remaining: Duration,
        val total: Duration,
        val finishesAt: Instant,
    ) : HiringOrderLine

    data class Done(val hire: TownHireKind, val count: Int, val delivered: Int) : HiringOrderLine
}
