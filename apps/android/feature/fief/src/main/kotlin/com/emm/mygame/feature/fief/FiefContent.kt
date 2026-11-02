package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.projection.ResourceStock
import com.emm.mygame.core.projection.countdownTo
import kotlin.math.floor
import kotlin.time.Duration
import kotlin.time.Instant

internal fun FiefSnapshot.contentAt(now: Instant): FiefUiState.Content = FiefUiState.Content(
    name = name,
    resources = resources.map { stored: StoredResource -> stored.lineAt(readAt = readAt, now = now) },
    slot = slot.lineAt(now),
)

internal fun FiefSnapshot.slotRemainingAt(now: Instant): Duration? = when (val current: BuildSlot = slot) {
    BuildSlot.Idle -> null
    is BuildSlot.Busy -> countdownTo(finishesAt = current.finishesAt, now = now)
}

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
