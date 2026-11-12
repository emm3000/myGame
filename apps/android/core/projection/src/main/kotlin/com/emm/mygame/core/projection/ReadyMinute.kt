package com.emm.mygame.core.projection

import kotlin.math.ceil
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

private const val MINUTES_PER_HOUR: Double = 60.0

private const val MILLISECONDS_PER_MINUTE: Long = 60_000

fun readyMinuteOf(needs: List<ResourceNeed>, readAt: Instant): Instant? {
    val shortNeeds: List<ResourceNeed> = needs.filter { need: ResourceNeed -> need.stock.amount < need.cost }
    if (!shortNeeds.all(ResourceNeed::isReachable)) return null
    val latest: Long = shortNeeds.maxOfOrNull { need: ResourceNeed -> need.minutesAfter(readAt) } ?: return null
    return roundedUpToMinute(readAt + latest.minutes)
}

private fun ResourceNeed.isReachable(): Boolean = stock.ratePerHour > 0 && cost <= stock.capacity

private fun ResourceNeed.minutesAfter(readAt: Instant): Long {
    val searched: LongRange = maxOf(1L, stock.minutesToGain(cost) - 1)..stock.minutesToGain(stock.capacity) + 1
    return searched.first { minute: Long -> stock.amountAt(readAt = readAt, now = readAt + minute.minutes) >= cost }
}

private fun ResourceStock.minutesToGain(target: Long): Long =
    ceil((target - amount) * MINUTES_PER_HOUR / ratePerHour).toLong()

private fun roundedUpToMinute(instant: Instant): Instant {
    val milliseconds: Long = instant.toEpochMilliseconds()
    val wholeMinutes: Long = Math.floorDiv(milliseconds + MILLISECONDS_PER_MINUTE - 1, MILLISECONDS_PER_MINUTE)
    return Instant.fromEpochMilliseconds(wholeMinutes * MILLISECONDS_PER_MINUTE)
}
