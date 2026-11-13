package com.emm.mygame.feature.town

import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nextStepCard
import com.emm.mygame.core.projection.ResourceNeed
import com.emm.mygame.core.projection.ResourceStock
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.readyMinuteOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

private val fillHourWindow: Duration = 8.hours

internal fun TownSnapshot.contentAt(
    now: Instant,
    gap: Duration,
    mutations: TownMutations,
    registered: TownRegistered,
    hireEntries: Map<TownHireKind, String>,
    closed: ClosedGuidance,
): TownUiState.Content {
    val lines: List<TownUiState.StockLine> = stocks
        .sortedBy { stock: TownSnapshot.Stock -> stock.kind.ordinal }
        .map { stock: TownSnapshot.Stock -> stock.lineAt(readAt, now, gap, skillLevelOf(stock.kind)) }
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
            .map { place: TownSnapshot.Building -> place.cardWith(drawn, this, registered, now, gap) },
        nextStep = card,
        nextStepTime = card.countdown?.timeAt(now, gap),
        goal = (nextStep as? NextStep.CaughtUp)?.goal?.takeUnless { closed.isGoalClosed },
        tip = tip?.takeUnless { shown: TipKind -> shown in closed.tips },
        start = mutations.start,
        stop = mutations.stop,
        lessonStart = mutations.lessonStart,
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

internal fun List<TownUiState.CostLine>.shortfallsAgainst(
    drawn: Map<TownResourceKind, Long>,
): List<TownUiState.Shortfall> =
    map { cost: TownUiState.CostLine -> TownUiState.Shortfall(cost.kind, cost.amount - drawn.getValue(cost.kind)) }
        .filter { shortfall: TownUiState.Shortfall -> shortfall.amount > 0 }

internal fun TownSnapshot.readyTimeOf(
    costs: List<TownUiState.CostLine>,
    now: Instant,
    gap: Duration,
): TownUiState.ReadyTime? {
    val needs: List<ResourceNeed> = costs.map { cost: TownUiState.CostLine ->
        val stock: TownSnapshot.Stock = stocks.first { held: TownSnapshot.Stock -> held.kind == cost.kind }
        ResourceNeed(stock = stock.projected(), cost = cost.amount)
    }
    val ready: Instant = readyMinuteOf(needs, readAt) ?: return null
    return TownUiState.ReadyTime(remaining = countdownTo(finishesAt = ready, now = now), readyAt = ready - gap)
}

private fun TownSnapshot.Stock.projected(): ResourceStock = ResourceStock(amount, ratePerHour, capacity)

private fun TownSnapshot.Stock.lineAt(
    readAt: Instant,
    now: Instant,
    gap: Duration,
    skillLevel: Int,
): TownUiState.StockLine {
    val amount: Long = projected().amountAt(readAt = readAt, now = now)
    return TownUiState.StockLine(
        kind = kind,
        amount = amount,
        capacity = capacity,
        ratePerHour = ratePerHour.toLong(),
        skillLevel = skillLevel,
        fill = if (amount < capacity) fillTimeAt(readAt, now, gap) else null,
    )
}

private fun TownSnapshot.Stock.fillTimeAt(readAt: Instant, now: Instant, gap: Duration): TownUiState.FillTime? {
    val fillsAt: Instant = fullAt ?: return null
    if (fillsAt - readAt > fillHourWindow) return null
    return TownUiState.FillTime(remaining = countdownTo(finishesAt = fillsAt, now = now), fullAt = fillsAt - gap)
}

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
    now: Instant,
    gap: Duration,
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
        block = line?.blockIn(town, drawn, now, gap),
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

private fun TownUiState.NextLevelLine.blockIn(
    town: TownSnapshot,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): TownUiState.BlockReason? {
    val work: TownSnapshot.Work = town.work
    if (work.slot != null && work.waitingList.size >= work.cap) return TownUiState.BlockReason.WaitingListFull(work.cap)
    if (work.slot == null && work.waitingList.isEmpty() && people > town.people.free) {
        return TownUiState.BlockReason.PeopleShort(needed = people, free = town.people.free)
    }
    val shortfalls: List<TownUiState.Shortfall> = costs.shortfallsAgainst(drawn)
    return if (shortfalls.isEmpty()) {
        null
    } else {
        TownUiState.BlockReason.Resources(shortfalls, ready = town.readyTimeOf(costs, now, gap))
    }
}
