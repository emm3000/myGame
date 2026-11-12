package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal const val FIRST_HIRE_ENTRY: String = "1"

private val wholeCount: Regex = Regex("^[0-9]+$")

internal fun hireCountOf(entry: String): Int? {
    if (!wholeCount.matches(entry)) return null
    return entry.toIntOrNull()?.takeIf { count: Int -> count >= 1 }
}

internal fun TownSnapshot.officeLineAt(
    now: Instant,
    gap: Duration,
    drawn: Map<TownResourceKind, Long>,
    entries: Map<TownHireKind, String>,
    mutations: TownMutations,
): TownUiState.OfficeLine = TownUiState.OfficeLine(
    hiring = hiring.order?.hiringLineAt(now, gap) ?: TownUiState.HiringLine.Idle,
    hires = TownHireKind.entries.map { kind: TownHireKind ->
        hireCardOf(kind, entries[kind] ?: FIRST_HIRE_ENTRY, drawn, now, gap)
    },
    place = mutations.hire,
    stop = mutations.hireStop,
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

private fun TownSnapshot.hireCardOf(
    kind: TownHireKind,
    entry: String,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): TownUiState.HireCard {
    val terms: TownSnapshot.HireTerms = hiring.terms.getValue(kind)
    val officeLevel: Int = buildings
        .first { place: TownSnapshot.Building -> place.kind == TownBuildingKind.Office }
        .level
    return TownUiState.HireCard(
        kind = kind,
        team = hiring.hires.getValue(kind),
        requiredOfficeLevel = terms.requiredOfficeLevel,
        form = if (officeLevel < terms.requiredOfficeLevel) null else hireFormOf(terms, entry, drawn, now, gap),
    )
}

private fun TownSnapshot.hireFormOf(
    terms: TownSnapshot.HireTerms,
    entry: String,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): TownUiState.HireForm {
    val count: Int? = hireCountOf(entry)
    val offer: TownUiState.HireOffer? = count?.let { counted: Int -> offerOf(terms, counted, drawn) }
    return TownUiState.HireForm(
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
): TownUiState.HireOffer {
    val needed: Long = terms.people.toLong() * count
    val free: Int? = freePeople()
    return TownUiState.HireOffer(
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
    offer: TownUiState.HireOffer?,
    drawn: Map<TownResourceKind, Long>,
    now: Instant,
    gap: Duration,
): TownUiState.HireBlock? {
    if (offer == null) return TownUiState.HireBlock.CountNeeded
    if (hiring.order != null) return TownUiState.HireBlock.Busy
    val free: Int? = freePeople()
    if (free != null && offer.people > free) {
        return TownUiState.HireBlock.PeopleShort(needed = offer.people, free = free)
    }
    val shortfalls: List<TownUiState.Shortfall> = offer.costs.shortfallsAgainst(drawn)
    return if (shortfalls.isEmpty()) {
        null
    } else {
        TownUiState.HireBlock.Resources(shortfalls, ready = readyTimeOf(offer.costs, now, gap))
    }
}

private fun TownSnapshot.freePeople(): Int? =
    if (work.slot == null && work.waitingList.isEmpty()) people.free else null
