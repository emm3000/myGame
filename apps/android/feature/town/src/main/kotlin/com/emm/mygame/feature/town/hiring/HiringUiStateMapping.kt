package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.feature.town.TownRequests
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.hireMark
import com.emm.mygame.feature.town.readyTimeOf
import com.emm.mygame.feature.town.shortfallsAgainst
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal const val FIRST_HIRE_ENTRY: String = "1"

private val wholeCount: Regex = Regex("^[0-9]+$")

internal fun hireCountOf(entry: String): Int? {
    if (!wholeCount.matches(entry)) return null
    return entry.toIntOrNull()?.takeIf { count: Int -> count >= 1 }
}

internal fun TownSnapshot.hiringAt(
    now: Instant,
    gap: Duration,
    drawn: Map<TownResourceKind, Long>,
    entries: Map<TownHireKind, String>,
    requests: TownRequests,
): TownUiState.Hiring = TownUiState.Hiring(
    order = hiring.order?.hiringLineAt(now, gap) ?: TownUiState.HiringLine.Idle,
    hires = TownHireKind.entries.map { kind: TownHireKind ->
        hiringCardOf(kind, entries[kind] ?: FIRST_HIRE_ENTRY, drawn, now, gap)
    },
    hireMark = seasonInForce?.hireMark(),
    place = requests.hiring,
    stop = requests.hiringStop,
)

private fun TownSnapshot.HiringOrder.hiringLineAt(now: Instant, gap: Duration): TownUiState.HiringLine {
    val remaining: Duration = countdownTo(finishesAt = endsAt, now = now)
    if (remaining == Duration.ZERO) return TownUiState.HiringLine.Done(hire, count, delivered)
    return TownUiState.HiringLine.Busy(
        target = TownUiState.HiringTarget(hire, startedAt),
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
): TownUiState.HiringCard {
    val terms: TownSnapshot.HireTerms = hiring.terms.getValue(kind)
    val officeLevel: Int = buildings
        .first { place: TownSnapshot.Building -> place.kind == TownBuildingKind.Office }
        .level
    return TownUiState.HiringCard(
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
): TownUiState.HiringForm {
    val count: Int? = hireCountOf(entry)
    val offer: TownUiState.HiringOffer? = count?.let { counted: Int -> offerOf(terms, counted, drawn) }
    return TownUiState.HiringForm(
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
): TownUiState.HiringOffer {
    val needed: Long = terms.people.toLong() * count
    val free: Int? = freePeople()
    return TownUiState.HiringOffer(
        count = count,
        costs = terms.costs.map { cost: TownSnapshot.Cost ->
            val amount: Long = cost.amount * count
            TownUiState.CostLine(cost.kind, amount, isShort = amount > drawn.getValue(cost.kind))
        },
        people = needed,
        isPeopleShort = free != null && needed > free,
        duration = (terms.secondsPerHire.toLong() * count).seconds,
    )
}

private fun TownSnapshot.blockOf(
    offer: TownUiState.HiringOffer?,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): TownUiState.HiringBlock? {
    if (offer == null) return TownUiState.HiringBlock.CountNeeded
    if (hiring.order != null) return TownUiState.HiringBlock.Busy
    val free: Int? = freePeople()
    if (free != null && offer.people > free) {
        return TownUiState.HiringBlock.PeopleShort(needed = offer.people, free = free)
    }
    val shortfalls: List<TownUiState.Shortfall> = offer.costs.shortfallsAgainst(drawn)
    return if (shortfalls.isEmpty()) {
        null
    } else {
        TownUiState.HiringBlock.Resources(shortfalls, ready = readyTimeOf(offer.costs, now, gap))
    }
}

private fun TownSnapshot.freePeople(): Int? =
    if (work.slot == null && work.waitingList.isEmpty()) people.free else null
