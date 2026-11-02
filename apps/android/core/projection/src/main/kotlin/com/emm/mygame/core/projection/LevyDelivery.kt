package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Instant

fun deliveredUnitsAt(startedAt: Instant, perUnit: Duration, count: Int, now: Instant): Int {
    val sinceStart: Duration = (now - startedAt).coerceAtLeast(Duration.ZERO)
    val terms: Long = sinceStart.inWholeMilliseconds / perUnit.inWholeMilliseconds
    return terms.coerceAtMost(count.toLong()).toInt()
}
