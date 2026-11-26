package com.emm.mygame.core.projection.town.building

import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.projection.town.readyTimeOf
import kotlin.time.Duration
import kotlin.time.Instant

fun NextLevelLine.blockIn(
    town: TownSnapshot,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): BlockReason? {
    val work: TownSnapshot.Work = town.work
    if (work.slot != null && work.waitingList.size >= work.cap) return BlockReason.WaitingListFull(work.cap)
    if (work.slot == null && work.waitingList.isEmpty() && people > town.people.free) {
        return BlockReason.PeopleShort(needed = people, free = town.people.free)
    }
    val shortfalls: List<Shortfall> = costs.shortfallsAgainst(drawn)
    return if (shortfalls.isEmpty()) {
        null
    } else {
        BlockReason.Resources(shortfalls, ready = town.readyTimeOf(costs, now, gap))
    }
}

fun List<CostLine>.shortfallsAgainst(drawn: Map<TownResourceKind, Long>): List<Shortfall> =
    map { cost: CostLine -> Shortfall(cost.kind, cost.amount - drawn.getValue(cost.kind)) }
        .filter { shortfall: Shortfall -> shortfall.amount > 0 }
