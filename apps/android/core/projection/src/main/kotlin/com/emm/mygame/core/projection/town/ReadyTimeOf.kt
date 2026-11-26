package com.emm.mygame.core.projection.town

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.projection.ResourceNeed
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.readyMinuteOf
import com.emm.mygame.core.projection.town.building.CostLine
import kotlin.time.Duration
import kotlin.time.Instant

fun TownSnapshot.readyTimeOf(
    costs: List<CostLine>,
    now: Instant,
    gap: Duration,
): ReadyTime? {
    val needs: List<ResourceNeed> = costs.map { cost: CostLine ->
        val stock: TownSnapshot.Stock = stocks.first { held: TownSnapshot.Stock -> held.kind == cost.kind }
        ResourceNeed(stock = stock.projected(), cost = cost.amount)
    }
    val ready: Instant = readyMinuteOf(needs, readAt) ?: return null
    return ReadyTime(remaining = countdownTo(finishesAt = ready, now = now), readyAt = ready - gap)
}
