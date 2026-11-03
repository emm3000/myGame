package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.projection.ResourceStock
import kotlin.math.ceil
import kotlin.math.max
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.DurationUnit
import kotlin.time.Instant

internal data class Accrual(
    val resources: List<StoredResource>,
    val readAt: Instant,
    val now: Instant,
    val gap: Duration,
)

internal fun Accrual.resourcesBlockOf(
    cost: List<ResourceCost>,
    amounts: Map<ResourceKind, Long>,
): FiefUiState.BlockReason.Resources? {
    val shortfalls: List<FiefUiState.Shortfall> = cost.shortfallsFrom(amounts)
    if (shortfalls.isEmpty()) return null
    return FiefUiState.BlockReason.Resources(shortfalls = shortfalls, ready = readyHourOf(cost, shortfalls))
}

private fun Accrual.readyHourOf(
    cost: List<ResourceCost>,
    shortfalls: List<FiefUiState.Shortfall>,
): FiefUiState.ReadyHour? {
    val readyAfter: Duration = latestReadyAfter(cost, shortfalls) ?: return null
    val ready: Instant = readAt + readyAfter
    val remaining: Duration = ready - now
    val remainingSeconds: Double = remaining.toDouble(DurationUnit.SECONDS)
    if (ceil(remainingSeconds) <= SECONDS_PER_HOUR) {
        return FiefUiState.ReadyHour.InMinutes(minutesLeftOf(remainingSeconds))
    }
    val readyMinute: Instant = nextWholeMinuteOf(ready - gap)
    return FiefUiState.ReadyHour.AtClock(readyAt = readyMinute, remaining = readyMinute - (now - gap))
}

private fun Accrual.latestReadyAfter(
    cost: List<ResourceCost>,
    shortfalls: List<FiefUiState.Shortfall>,
): Duration? {
    val readyAfters: List<Duration?> = shortfalls.map { shortfall: FiefUiState.Shortfall ->
        val needed: Long = cost.first { resource: ResourceCost -> resource.kind == shortfall.kind }.amount
        resources.firstOrNull { stored: StoredResource -> stored.kind == shortfall.kind }?.readyAfter(needed, readAt)
    }
    if (readyAfters.any { readyAfter: Duration? -> readyAfter == null }) return null
    return readyAfters.filterNotNull().max()
}

private fun StoredResource.readyAfter(cost: Long, readAt: Instant): Duration? {
    if (ratePerHour <= 0.0 || cost > capacity) return null
    val minutes: Long = ceil((cost - amount) * SECONDS_PER_HOUR / ratePerHour / SECONDS_PER_MINUTE).toLong()
    val stock: ResourceStock = ResourceStock(amount = amount, ratePerHour = ratePerHour, capacity = capacity)
    val isReached: Boolean = stock.amountAt(readAt = readAt, now = readAt + minutes.minutes) >= cost
    return (if (isReached) minutes else minutes + 1).minutes
}

private fun minutesLeftOf(remainingSeconds: Double): Int =
    (ceil(max(SECONDS_PER_MINUTE, remainingSeconds)) / SECONDS_PER_MINUTE).toInt()

private fun nextWholeMinuteOf(instant: Instant): Instant {
    val milliseconds: Long = instant.toEpochMilliseconds()
    return Instant.fromEpochMilliseconds(
        (milliseconds + MILLISECONDS_PER_MINUTE - 1) / MILLISECONDS_PER_MINUTE * MILLISECONDS_PER_MINUTE,
    )
}

private const val SECONDS_PER_HOUR: Double = 3600.0
private const val SECONDS_PER_MINUTE: Double = 60.0
private const val MILLISECONDS_PER_MINUTE: Long = 60_000
