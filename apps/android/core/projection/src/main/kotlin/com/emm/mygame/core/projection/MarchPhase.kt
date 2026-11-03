package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Instant

enum class MarchPhase {
    Outbound,
    Foraging,
    Returning,
}

fun marchPhaseAt(arrivesAt: Instant, leavesAt: Instant, now: Instant): MarchPhase = when {
    now < arrivesAt -> MarchPhase.Outbound
    now < leavesAt -> MarchPhase.Foraging
    else -> MarchPhase.Returning
}

fun nextMarchTurnAt(arrivesAt: Instant, leavesAt: Instant, now: Instant): Duration? = when {
    now < arrivesAt -> arrivesAt - now
    now < leavesAt -> leavesAt - now
    else -> null
}
