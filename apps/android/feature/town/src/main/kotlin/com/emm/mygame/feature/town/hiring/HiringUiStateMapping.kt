package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.feature.town.TownRequests
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.Shortfall
import com.emm.mygame.feature.town.hireMark
import com.emm.mygame.feature.town.readyTimeOf
import com.emm.mygame.feature.town.shortfallsAgainst
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal const val FIRST_HIRING_ENTRY: String = "1"

private val wholeCount: Regex = Regex("^[0-9]+$")

internal fun hireCountOf(entry: String): Int? {
    if (!wholeCount.matches(entry)) return null
    return entry.toIntOrNull()?.takeIf { count: Int -> count >= 1 }
}

internal fun TownSnapshot.hiringLineAt(
    now: Instant,
    gap: Duration,
    drawn: Map<TownResourceKind, Long>,
    entries: Map<TownHireKind, String>,
    requests: TownRequests,
): HiringLine = HiringLine(
    order = hiring.order?.hiringOrderLineAt(now, gap) ?: HiringOrderLine.Idle,
    hires = TownHireKind.entries.map { kind: TownHireKind ->
        hiringCardOf(kind, entries[kind] ?: FIRST_HIRING_ENTRY, drawn, now, gap)
    },
    hireMark = seasonInForce?.hireMark(),
    place = requests.hiringPlace,
    stop = requests.hiringStop,
)

private fun TownSnapshot.HiringOrder.hiringOrderLineAt(now: Instant, gap: Duration): HiringOrderLine {
    val remaining: Duration = countdownTo(finishesAt = endsAt, now = now)
    if (remaining == Duration.ZERO) return HiringOrderLine.Done(hire, count, delivered)
    return HiringOrderLine.Busy(
        target = HiringTarget(hire, startedAt),
        count = count,
        delivered = delivered,
        remaining = remaining,
        total = endsAt - startedAt,
        finishesAt = endsAt - gap,
    )
}

private fun TownSnapshot.hiringCardOf(
    kind: TownHireKind,
    entry: String,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): HiringCard {
    val terms: TownSnapshot.HireTerms = hiring.terms.getValue(kind)
    val officeLevel: Int = buildings
        .first { place: TownSnapshot.Building -> place.kind == TownBuildingKind.Office }
        .level
    return HiringCard(
        kind = kind,
        team = hiring.hires.getValue(kind),
        requiredOfficeLevel = terms.requiredOfficeLevel,
        form = if (officeLevel < terms.requiredOfficeLevel) null else hiringFormOf(terms, entry, drawn, now, gap),
    )
}

private fun TownSnapshot.hiringFormOf(
    terms: TownSnapshot.HireTerms,
    entry: String,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): HiringForm {
    val count: Int? = hireCountOf(entry)
    val offer: HiringOffer? = count?.let { counted: Int -> offerOf(terms, counted, drawn) }
    return HiringForm(
        entry = entry,
        isEntryDisabled = hiring.order != null,
        offer = offer,
        block = blockOf(offer, drawn, now, gap),
    )
}

private fun TownSnapshot.offerOf(
    terms: TownSnapshot.HireTerms,
    count: Int,
    drawn: Map<TownResourceKind, Long>,
): HiringOffer {
    val needed: Long = terms.people.toLong() * count
    val free: Int? = freePeople()
    return HiringOffer(
        count = count,
        costs = terms.costs.map { cost: TownSnapshot.Cost ->
            val amount: Long = cost.amount * count
            CostLine(cost.kind, amount, isShort = amount > drawn.getValue(cost.kind))
        },
        people = needed,
        isPeopleShort = free != null && needed > free,
        duration = (terms.secondsPerHire.toLong() * count).seconds,
    )
}

private fun TownSnapshot.blockOf(
    offer: HiringOffer?,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): HiringBlock? {
    if (offer == null) return HiringBlock.CountNeeded
    if (hiring.order != null) return HiringBlock.Busy
    val free: Int? = freePeople()
    if (free != null && offer.people > free) {
        return HiringBlock.PeopleShort(needed = offer.people, free = free)
    }
    val shortfalls: List<Shortfall> = offer.costs.shortfallsAgainst(drawn)
    return if (shortfalls.isEmpty()) {
        null
    } else {
        HiringBlock.Resources(shortfalls, ready = readyTimeOf(offer.costs, now, gap))
    }
}

private fun TownSnapshot.freePeople(): Int? =
    if (work.slot == null && work.waitingList.isEmpty()) people.free else null
