package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.RecruitOrder
import com.emm.mygame.core.network.RecruitTerms
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.UnitState
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.deliveredUnitsAt
import kotlin.time.Duration
import kotlin.time.Instant

internal fun FiefSnapshot.armyAt(
    readyTerms: ReadyTerms,
    amounts: Map<ResourceKind, Long>,
    mutations: Mutations,
): FiefUiState.ArmyLine? {
    val builtLevel: Int = barracksLevel()
    if (builtLevel < 1) return null
    val now: Instant = readyTerms.now
    val levy: RecruitOrder? = recruitOrder
    val deliveredSinceRead: Int = levy?.let { order: RecruitOrder -> order.deliveredAt(now) - order.delivered } ?: 0
    val context: RecruitContext = RecruitContext(
        builtLevel = builtLevel,
        amounts = amounts,
        freePeasants = peasants.lowestFree,
        isLevyRunning = levy != null,
        readyTerms = readyTerms,
    )
    return FiefUiState.ArmyLine(
        slot = levy?.let { order: RecruitOrder -> levySlotOf(order, now) } ?: FiefUiState.LevySlotLine.Idle,
        units = units.map { unit: UnitState ->
            val delivered: Int = if (unit.kind == levy?.unit) deliveredSinceRead else 0
            unit.cardWith(atHome = unit.count - unit.away + delivered, entry = mutations.entryOf(unit.kind), context)
        },
        recruit = mutations.recruit,
        march = march?.let { away: AwayMarch -> marchSlotOf(away, now) } ?: FiefUiState.MarchSlotLine.Idle,
        recall = mutations.recall,
    )
}

internal fun FiefSnapshot.levyRemainingAt(now: Instant): Duration? =
    recruitOrder?.let { order: RecruitOrder -> countdownTo(finishesAt = order.endsAt, now = now) }

internal fun recruitCountOf(entry: String): Int? {
    if (!wholeCount.matches(entry)) return null
    return entry.toIntOrNull()?.takeIf { count: Int -> count >= 1 }
}

private data class RecruitContext(
    val builtLevel: Int,
    val amounts: Map<ResourceKind, Long>,
    val freePeasants: Int,
    val isLevyRunning: Boolean,
    val readyTerms: ReadyTerms,
)

private fun FiefSnapshot.barracksLevel(): Int =
    buildings.firstOrNull { building: BuildingState -> building.kind == BuildingKind.Barracks }?.level ?: 0

private fun RecruitOrder.deliveredAt(now: Instant): Int =
    deliveredUnitsAt(startedAt = startedAt, perUnit = perUnit, count = count, now = now)

private fun FiefSnapshot.refundOf(order: RecruitOrder, undelivered: Int): List<ResourceCost> {
    val terms: RecruitTerms = units.firstOrNull { state: UnitState -> state.kind == order.unit }?.terms
        ?: return emptyList()
    return terms.cost.times(undelivered).filter { resource: ResourceCost -> resource.amount > 0 }
}

private fun FiefSnapshot.levySlotOf(order: RecruitOrder, now: Instant): FiefUiState.LevySlotLine.Busy {
    val delivered: Int = order.deliveredAt(now)
    return FiefUiState.LevySlotLine.Busy(
        unit = order.unit,
        count = order.count,
        delivered = delivered,
        remaining = countdownTo(finishesAt = order.endsAt, now = now),
        startedAt = order.startedAt,
        refund = refundOf(order, undelivered = order.count - delivered),
    )
}

private fun UnitState.cardWith(atHome: Int, entry: String, context: RecruitContext): FiefUiState.UnitCard {
    if (context.builtLevel < barracksLevel) {
        return FiefUiState.UnitCard.Locked(
            kind = kind,
            atHome = atHome,
            away = away,
            requiredLevel = barracksLevel,
            builtLevel = context.builtLevel,
        )
    }
    val count: Int? = recruitCountOf(entry)
    return FiefUiState.UnitCard.Open(
        kind = kind,
        atHome = atHome,
        away = away,
        entry = entry,
        isEntryLocked = context.isLevyRunning,
        order = count?.let { wanted: Int -> terms.lineFor(count = wanted, context = context) },
        block = terms.blockFor(count = count, context = context),
    )
}

private fun RecruitTerms.lineFor(count: Int, context: RecruitContext): FiefUiState.RecruitLine =
    FiefUiState.RecruitLine(
        count = count,
        costs = cost.times(count).filter { resource: ResourceCost -> resource.amount > 0 }.map { resource ->
            FiefUiState.CostLine(
                kind = resource.kind,
                amount = resource.amount,
                isShort = resource.shortfallFrom(context.amounts) > 0,
            )
        },
        peasants = peasants * count,
        isShortOfPeasants = peasants * count > context.freePeasants,
        duration = perUnit * count,
    )

private fun RecruitTerms.blockFor(count: Int?, context: RecruitContext): FiefUiState.RecruitBlock? {
    val needed: Int = peasants * (count ?: 0)
    return when {
        context.isLevyRunning -> FiefUiState.RecruitBlock.LevyRunning
        count == null -> FiefUiState.RecruitBlock.InvalidCount
        needed > context.freePeasants -> FiefUiState.BlockReason.Peasants(needed, context.freePeasants)
        else -> context.readyTerms.resourcesBlockOf(cost = cost.times(count), amounts = context.amounts)
    }
}

private fun List<ResourceCost>.times(count: Int): List<ResourceCost> =
    map { resource: ResourceCost -> resource.copy(amount = resource.amount * count) }

private val wholeCount: Regex = Regex("^[0-9]+$")
