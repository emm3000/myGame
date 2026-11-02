package com.emm.mygame.core.projection

import kotlin.math.floor
import kotlin.time.Duration
import kotlin.time.Instant

data class ResourceStock(val amount: Long, val ratePerHour: Double, val capacity: Long) {

    init {
        require(amount >= 0) { "a stored amount is never negative" }
        require(ratePerHour >= 0) { "a rate per hour is never negative" }
    }

    fun amountAt(readAt: Instant, now: Instant): Long {
        val elapsed: Duration = (now - readAt).coerceAtLeast(Duration.ZERO)
        val accrued: Long = floor(
            (amount * MILLISECONDS_PER_HOUR + ratePerHour * elapsed.inWholeMilliseconds) / MILLISECONDS_PER_HOUR,
        ).toLong()
        return maxOf(amount, minOf(capacity, accrued))
    }

    private companion object {
        const val MILLISECONDS_PER_HOUR: Double = 3_600_000.0
    }
}
