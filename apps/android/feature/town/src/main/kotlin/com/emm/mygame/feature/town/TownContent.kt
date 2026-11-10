package com.emm.mygame.feature.town

import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nextStepCard
import com.emm.mygame.core.projection.ResourceStock
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.contentAt(
    now: Instant,
    gap: Duration,
    mutations: TownMutations,
    registered: TownRegistered,
    hireEntries: Map<TownHireKind, String>,
): TownUiState.Content {
    val lines: List<TownUiState.StockLine> = stocks
        .sortedBy { stock: TownSnapshot.Stock -> stock.kind.ordinal }
        .map { stock: TownSnapshot.Stock -> stock.lineAt(readAt, now, skillLevelOf(stock.kind)) }
    val drawn: Map<TownResourceKind, Long> = lines.associate { line: TownUiState.StockLine -> line.kind to line.amount }
    val card: NextStepCard = nextStepCard()
    return TownUiState.Content(
        name = name,
        label = label,
        stocks = lines,
        people = TownUiState.PeopleLine(free = people.free, atWork = people.atWork),
        season = seasonLineAt(now),
        slot = work.slot?.slotLineAt(now, gap) ?: TownUiState.SlotLine.Idle,
        waitingList = work.waitingList.map { item: TownSnapshot.WorkItem -> item.waitingLineAt(now, gap) },
        places = buildings
            .sortedBy { place: TownSnapshot.Building -> place.kind != TownBuildingKind.School }
            .map { place: TownSnapshot.Building -> place.cardWith(drawn, this, registered) },
        nextStep = card,
        nextStepTime = card.countdown?.timeAt(now, gap),
        start = mutations.start,
        stop = mutations.stop,
        office = officeLineAt(now = now, gap = gap, drawn = drawn, entries = hireEntries, mutations = mutations),
    )
}

internal fun TownSnapshot.isDueAt(now: Instant): Boolean =
    changesOnTheirOwn().any { instant: Instant -> instant > readAt && instant <= now }

internal fun TownSnapshot.nearestCountdownAt(now: Instant): Duration? =
    (changesOnTheirOwn() + work.waitingList.map { item: TownSnapshot.WorkItem -> item.finishesAt })
        .filter { instant: Instant -> instant > now }
        .minOrNull()
        ?.let { instant: Instant -> instant - now }

private fun NextStepCard.Countdown.timeAt(now: Instant, gap: Duration): TownUiState.NextStepTime =
    TownUiState.NextStepTime(remaining = countdownTo(finishesAt = at, now = now), finishesAt = at - gap)

private fun TownSnapshot.seasonLineAt(now: Instant): TownUiState.SeasonLine? {
    val inForce: SeasonInForce = seasonInForce ?: return null
    val endsAt: Instant = seasonEndsAt ?: return null
    return TownUiState.SeasonLine(inForce.kind, inForce.year, countdownTo(finishesAt = endsAt, now = now))
}

private fun TownSnapshot.changesOnTheirOwn(): List<Instant> =
    listOfNotNull(work.slot?.finishesAt, lessonSlot?.finishesAt, hiring.order?.endsAt, seasonEndsAt, nextDueAt)

private fun TownSnapshot.Stock.lineAt(readAt: Instant, now: Instant, skillLevel: Int): TownUiState.StockLine =
    TownUiState.StockLine(
        kind = kind,
        amount = ResourceStock(amount, ratePerHour, capacity).amountAt(readAt = readAt, now = now),
        capacity = capacity,
        ratePerHour = ratePerHour.toLong(),
        skillLevel = skillLevel,
    )

private fun TownSnapshot.skillLevelOf(kind: TownResourceKind): Int =
    skills.count { skill: TownSnapshot.EarnedSkill -> skill.resource == kind }

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
    registered: TownRegistered,
): TownUiState.PlaceCard {
    val line: TownUiState.NextLevelLine? = next?.lineWith(drawn)
    return TownUiState.PlaceCard(
        kind = kind,
        level = level,
        raisedFrom = registered.raisedPlaces
            .firstOrNull { raised: TownRegistered.RaisedPlace -> raised.kind == kind }
            ?.levelBefore,
        isInWork = town.isWorkingOn(kind),
        next = line,
        block = next?.blockIn(town, drawn),
    )
}

private fun TownSnapshot.isWorkingOn(kind: TownBuildingKind): Boolean =
    (listOfNotNull(work.slot) + work.waitingList).any { item: TownSnapshot.WorkItem -> item.building == kind }

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
