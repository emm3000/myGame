package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.ResourceStock
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.contentAt(now: Instant, gap: Duration, mutations: TownMutations): TownUiState.Content {
    val lines: List<TownUiState.StockLine> = stocks.map { stock: TownSnapshot.Stock -> stock.lineAt(readAt, now) }
    val drawn: Map<TownResourceKind, Long> = lines.associate { line: TownUiState.StockLine -> line.kind to line.amount }
    return TownUiState.Content(
        name = name,
        label = label,
        stocks = lines,
        people = TownUiState.PeopleLine(free = people.free, atWork = people.atWork),
        slot = work.slot?.slotLineAt(now, gap) ?: TownUiState.SlotLine.Idle,
        waitingList = work.waitingList.map { item: TownSnapshot.WorkItem -> item.waitingLineAt(now, gap) },
        places = buildings.map { place: TownSnapshot.Building -> place.cardWith(drawn, this) },
        start = mutations.start,
        stop = mutations.stop,
    )
}

internal fun TownSnapshot.isDueAt(now: Instant): Boolean =
    changesOnTheirOwn().any { instant: Instant -> instant <= now }

internal fun TownSnapshot.nearestCountdownAt(now: Instant): Duration? =
    (changesOnTheirOwn() + work.waitingList.map { item: TownSnapshot.WorkItem -> item.finishesAt })
        .filter { instant: Instant -> instant > now }
        .minOrNull()
        ?.let { instant: Instant -> instant - now }

private fun TownSnapshot.changesOnTheirOwn(): List<Instant> =
    listOfNotNull(work.slot?.finishesAt, lessonSlot?.finishesAt, seasonEndsAt)

private fun TownSnapshot.Stock.lineAt(readAt: Instant, now: Instant): TownUiState.StockLine = TownUiState.StockLine(
    kind = kind,
    amount = ResourceStock(amount, ratePerHour, capacity).amountAt(readAt = readAt, now = now),
    capacity = capacity,
    ratePerHour = ratePerHour.toLong(),
)

private fun TownSnapshot.WorkItem.slotLineAt(now: Instant, gap: Duration): TownUiState.SlotLine {
    val remaining: Duration = countdownTo(finishesAt = finishesAt, now = now)
    if (remaining == Duration.ZERO) return TownUiState.SlotLine.Done(building, level)
    return TownUiState.SlotLine.Busy(
        building = building,
        level = level,
        remaining = remaining,
        total = finishesAt - startsAt,
        finishesAt = finishesAt - gap,
    )
}

private fun TownSnapshot.WorkItem.waitingLineAt(now: Instant, gap: Duration): TownUiState.WaitingLine =
    TownUiState.WaitingLine(
        building = building,
        level = level,
        remaining = countdownTo(finishesAt = finishesAt, now = now),
        finishesAt = finishesAt - gap,
    )

private fun TownSnapshot.Building.cardWith(
    drawn: Map<TownResourceKind, Long>,
    town: TownSnapshot,
): TownUiState.PlaceCard {
    val line: TownUiState.NextLevelLine? = next?.lineWith(drawn)
    return TownUiState.PlaceCard(kind = kind, level = level, next = line, block = next?.blockIn(town, drawn))
}

private fun TownSnapshot.NextLevel.lineWith(drawn: Map<TownResourceKind, Long>): TownUiState.NextLevelLine =
    TownUiState.NextLevelLine(
        level = level,
        costs = costs.map { cost: TownSnapshot.Cost ->
            TownUiState.CostLine(cost.kind, cost.amount, isShort = cost.amount > drawn.getValue(cost.kind))
        },
        duration = duration,
        people = people,
    )

private fun TownSnapshot.NextLevel.blockIn(
    town: TownSnapshot,
    drawn: Map<TownResourceKind, Long>,
): TownUiState.BlockReason? {
    val work: TownSnapshot.Work = town.work
    if (work.slot != null && work.waitingList.size >= work.cap) return TownUiState.BlockReason.WaitingListFull(work.cap)
    if (work.slot == null && work.waitingList.isEmpty() && people > town.people.free) {
        return TownUiState.BlockReason.PeopleShort(needed = people, free = town.people.free)
    }
    val shortfalls: List<TownUiState.Shortfall> = costs
        .map { cost: TownSnapshot.Cost -> TownUiState.Shortfall(cost.kind, cost.amount - drawn.getValue(cost.kind)) }
        .filter { shortfall: TownUiState.Shortfall -> shortfall.amount > 0 }
    return if (shortfalls.isEmpty()) null else TownUiState.BlockReason.Resources(shortfalls)
}
