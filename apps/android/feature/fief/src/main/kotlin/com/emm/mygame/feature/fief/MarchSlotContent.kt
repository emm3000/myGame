package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.projection.MarchPhase
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.marchPhaseAt
import com.emm.mygame.core.projection.nextMarchTurnAt
import kotlin.time.Duration
import kotlin.time.Instant

internal fun FiefSnapshot.marchRemainingAt(now: Instant): Duration? =
    march?.let { away: AwayMarch -> countdownTo(finishesAt = away.endsAt(), now = now) }

internal fun FiefSnapshot.battleRemainingAt(now: Instant): Duration? =
    march?.takeIf { away: AwayMarch -> away.isBattleAhead() }?.let { away: AwayMarch ->
        countdownTo(finishesAt = away.arrivesAt, now = now)
    }

internal fun FiefSnapshot.marchTurnAt(now: Instant): Duration? =
    march?.let { away: AwayMarch -> nextMarchTurnAt(arrivesAt = away.arrivesAt, leavesAt = away.leavesAt, now = now) }

internal fun marchSlotOf(away: AwayMarch, now: Instant): FiefUiState.MarchSlotLine.Busy {
    val phase: MarchPhase = marchPhaseAt(arrivesAt = away.arrivesAt, leavesAt = away.leavesAt, now = now)
    val isArrivalAhead: Boolean =
        away.isFoundingOnTheWay() || (away.order == MarchOrder.Transport && phase == MarchPhase.Outbound)
    return FiefUiState.MarchSlotLine.Busy(
        phase = phase,
        heading = away.headingAt(phase),
        units = away.units.filter { count: UnitCount -> count.count > 0 },
        target = away.target,
        detail = away.detailAt(phase),
        countdown = if (isArrivalAhead) FiefUiState.MarchCountdown.Arrival else FiefUiState.MarchCountdown.Return,
        remaining = countdownTo(finishesAt = if (isArrivalAhead) away.arrivesAt else away.endsAt(), now = now),
        loot = if (away.order == MarchOrder.Transport) emptyList() else away.loot,
        departedAt = away.departedAt,
    )
}

private fun AwayMarch.headingAt(phase: MarchPhase): FiefUiState.MarchHeading = when {
    isFoundingOnTheWay() -> FiefUiState.MarchHeading.FoundingOutbound
    order == MarchOrder.Transport ->
        if (phase == MarchPhase.Outbound) {
            FiefUiState.MarchHeading.TransportOutbound
        } else {
            FiefUiState.MarchHeading.TransportReturning
        }
    order != MarchOrder.Attack || recalledAt != null -> when (phase) {
        MarchPhase.Outbound -> FiefUiState.MarchHeading.Outbound
        MarchPhase.Foraging -> FiefUiState.MarchHeading.Foraging
        MarchPhase.Returning -> FiefUiState.MarchHeading.Returning
    }
    phase == MarchPhase.Outbound -> FiefUiState.MarchHeading.AttackOutbound
    else -> FiefUiState.MarchHeading.AttackReturning
}

private fun AwayMarch.detailAt(phase: MarchPhase): FiefUiState.MarchDetail? {
    val isRecalled: Boolean = recalledAt != null
    val attacked: MarchCamp? = camp
    val founded: String? = foundingName
    return when {
        order == MarchOrder.Transport ->
            if (phase == MarchPhase.Outbound || isRecalled) FiefUiState.MarchDetail.Cargo(cargo) else null
        order == MarchOrder.Found ->
            if (founded != null && !isRecalled) FiefUiState.MarchDetail.NewFief(founded) else null
        attacked != null && !isRecalled -> FiefUiState.MarchDetail.Camp(attacked)
        else -> null
    }
}

internal fun AwayMarch.isFoundingOnTheWay(): Boolean = order == MarchOrder.Found && recalledAt == null

private fun AwayMarch.isBattleAhead(): Boolean = order == MarchOrder.Attack && !isFought && recalledAt == null

private fun AwayMarch.endsAt(): Instant = if (isFoundingOnTheWay()) arrivesAt else returnsAt
