package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.NextLevel
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.WaitingUpgrade
import com.emm.mygame.core.projection.ResourceStock
import com.emm.mygame.core.projection.countdownTo
import kotlin.math.floor
import kotlin.time.Duration
import kotlin.time.Instant

internal fun FiefSnapshot.contentAt(now: Instant, gap: Duration, mutations: Mutations): FiefUiState.Content {
    val lines: List<FiefUiState.ResourceLine> = resources.map { stored: StoredResource ->
        stored.lineAt(readAt = readAt, now = now)
    }
    val drawnAmounts: Map<ResourceKind, Long> = lines.associate { line: FiefUiState.ResourceLine ->
        line.kind to line.amount
    }
    val isQueueFull: Boolean = slot is BuildSlot.Busy && queue.isFull()
    val waiting: List<FiefUiState.WaitingLine> = queue.entries.map { entry: WaitingUpgrade ->
        FiefUiState.WaitingLine(
            building = entry.building,
            targetLevel = entry.targetLevel,
            remaining = countdownTo(finishesAt = entry.finishesAt, now = now),
            finishesAt = entry.finishesAt - gap,
        )
    }
    return FiefUiState.Content(
        name = name,
        resources = lines,
        peasants = FiefUiState.PeasantsLine(free = peasants.free, supplied = peasants.supplied),
        slot = slot.lineAt(now),
        buildings = buildings.map { building: BuildingState ->
            building.cardWith(amounts = drawnAmounts, peasants = peasants, isQueueFull = isQueueFull)
        },
        queue = waiting,
        upgrade = mutations.upgrade,
        cancel = mutations.cancel,
    )
}

internal fun FiefSnapshot.slotRemainingAt(now: Instant): Duration? = when (val current: BuildSlot = slot) {
    BuildSlot.Idle -> null
    is BuildSlot.Busy -> countdownTo(finishesAt = current.finishesAt, now = now)
}

private fun BuildQueue.isFull(): Boolean = entries.size >= cap

private fun StoredResource.lineAt(readAt: Instant, now: Instant): FiefUiState.ResourceLine {
    val stock: ResourceStock = ResourceStock(amount = amount, ratePerHour = ratePerHour, capacity = capacity)
    return FiefUiState.ResourceLine(
        kind = kind,
        amount = stock.amountAt(readAt = readAt, now = now),
        capacity = capacity,
        ratePerHour = floor(ratePerHour).toLong(),
    )
}

private fun BuildSlot.lineAt(now: Instant): FiefUiState.SlotLine = when (this) {
    BuildSlot.Idle -> FiefUiState.SlotLine.Idle
    is BuildSlot.Busy -> FiefUiState.SlotLine.Busy(
        building = building,
        targetLevel = targetLevel,
        remaining = countdownTo(finishesAt = finishesAt, now = now),
    )
}

private fun BuildingState.cardWith(
    amounts: Map<ResourceKind, Long>,
    peasants: Peasants,
    isQueueFull: Boolean,
): FiefUiState.BuildingCard {
    val next: NextLevel? = nextLevel
    return FiefUiState.BuildingCard(
        kind = kind,
        level = level,
        next = next?.lineWith(amounts = amounts, peasants = peasants),
        block = next?.blockWith(amounts = amounts, peasants = peasants, isQueueFull = isQueueFull),
    )
}

private fun NextLevel.lineWith(amounts: Map<ResourceKind, Long>, peasants: Peasants): FiefUiState.NextLevelLine =
    FiefUiState.NextLevelLine(
        level = level,
        costs = cost.filter { resource: ResourceCost -> resource.amount > 0 }.map { resource: ResourceCost ->
            FiefUiState.CostLine(
                kind = resource.kind,
                amount = resource.amount,
                isShort = resource.shortfallFrom(amounts) > 0,
            )
        },
        duration = duration,
        peasants = this.peasants,
        isShortOfPeasants = this.peasants > peasants.free,
    )

private fun NextLevel.blockWith(
    amounts: Map<ResourceKind, Long>,
    peasants: Peasants,
    isQueueFull: Boolean,
): FiefUiState.BlockReason? {
    val shortfalls: List<FiefUiState.Shortfall> = cost
        .map { resource: ResourceCost -> FiefUiState.Shortfall(resource.kind, resource.shortfallFrom(amounts)) }
        .filter { shortfall: FiefUiState.Shortfall -> shortfall.amount > 0 }
    return when {
        isQueueFull -> FiefUiState.BlockReason.QueueFull
        this.peasants > peasants.free -> FiefUiState.BlockReason.Peasants(needed = this.peasants, free = peasants.free)
        shortfalls.isNotEmpty() -> FiefUiState.BlockReason.Resources(shortfalls)
        else -> null
    }
}

private fun ResourceCost.shortfallFrom(amounts: Map<ResourceKind, Long>): Long =
    (amount - (amounts[kind] ?: 0L)).coerceAtLeast(0L)
