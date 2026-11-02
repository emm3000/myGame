package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.FiefOverviewRecruitOrder
import com.emm.mygame.core.network.generated.models.FiefOverviewRecruitTerms
import com.emm.mygame.core.network.generated.models.FiefOverviewRecruitTermsInfantry
import com.emm.mygame.core.network.generated.models.FiefOverviewUnitTerms
import com.emm.mygame.core.network.generated.models.FiefOverviewUnitTermsInfantry
import com.emm.mygame.core.network.generated.models.FiefOverviewUnits
import com.emm.mygame.core.network.generated.models.MarchState
import com.emm.mygame.core.network.generated.models.PlaceRecruitOrderRequest
import kotlin.time.Duration.Companion.seconds

internal fun FiefOverview.toArmy(): MappedArmy? {
    val away: FiefOverviewUnits? = march?.units()
    val unitStates: List<UnitState> = UnitKind.entries.map { kind: UnitKind -> unitStateOf(kind, away) ?: return null }
    val levy: RecruitOrder? = recruitOrder?.toRecruitOrder()
    if (recruitOrder != null && levy == null) return null
    return MappedArmy(units = unitStates, recruitOrder = levy)
}

private fun FiefOverview.unitStateOf(kind: UnitKind, away: FiefOverviewUnits?): UnitState? {
    val count: Int? = units.countOf(kind)
    val terms: FiefOverviewRecruitTermsInfantry? = recruitTerms.termsOf(kind)
    val levelTerms: FiefOverviewUnitTermsInfantry? = unitTerms.termsOf(kind)
    if (count == null || terms == null || levelTerms == null) return null
    return UnitState(
        kind = kind,
        count = count,
        away = away?.countOf(kind) ?: 0,
        barracksLevel = levelTerms.barracksLevel,
        terms = RecruitTerms(
            cost = terms.cost.toResourceCosts(),
            peasants = terms.peasants,
            perUnit = terms.perUnitSeconds.seconds,
        ),
    )
}

private fun FiefOverviewRecruitOrder.toRecruitOrder(): RecruitOrder? {
    val kind: UnitKind = unit.toUnitKind() ?: return null
    return RecruitOrder(
        unit = kind,
        count = count,
        delivered = delivered,
        perUnit = perUnitSeconds.seconds,
        startedAt = startedAt.toKotlinInstant(),
        endsAt = endsAt.toKotlinInstant(),
    )
}

internal fun UnitKind.toWireUnit(): PlaceRecruitOrderRequest.Unit = when (this) {
    UnitKind.Infantry -> PlaceRecruitOrderRequest.Unit.infantry
    UnitKind.Cavalry -> PlaceRecruitOrderRequest.Unit.cavalry
    UnitKind.Archer -> PlaceRecruitOrderRequest.Unit.archer
    UnitKind.Settler -> PlaceRecruitOrderRequest.Unit.settler
}

private fun MarchState.units(): FiefOverviewUnits = when (this) {
    is MarchState.AttackWrapper -> value.units
    is MarchState.ForageWrapper -> value.units
    is MarchState.FoundWrapper -> value.units
    is MarchState.TransportWrapper -> value.units
}

private fun FiefOverviewUnits.countOf(kind: UnitKind): Int? = when (kind) {
    UnitKind.Infantry -> infantry
    UnitKind.Cavalry -> cavalry
    UnitKind.Archer -> archer
    UnitKind.Settler -> settler
}

private fun FiefOverviewRecruitTerms.termsOf(
    kind: UnitKind,
): FiefOverviewRecruitTermsInfantry? = when (kind) {
    UnitKind.Infantry -> infantry
    UnitKind.Cavalry -> cavalry
    UnitKind.Archer -> archer
    UnitKind.Settler -> settler
}

private fun FiefOverviewUnitTerms.termsOf(
    kind: UnitKind,
): FiefOverviewUnitTermsInfantry? = when (kind) {
    UnitKind.Infantry -> infantry
    UnitKind.Cavalry -> cavalry
    UnitKind.Archer -> archer
    UnitKind.Settler -> settler
}

private fun FiefOverviewRecruitOrder.Unit.toUnitKind(): UnitKind? = when (this) {
    FiefOverviewRecruitOrder.Unit.infantry -> UnitKind.Infantry
    FiefOverviewRecruitOrder.Unit.cavalry -> UnitKind.Cavalry
    FiefOverviewRecruitOrder.Unit.archer -> UnitKind.Archer
    FiefOverviewRecruitOrder.Unit.settler -> UnitKind.Settler
    FiefOverviewRecruitOrder.Unit.unknown_default_open_api -> null
}
