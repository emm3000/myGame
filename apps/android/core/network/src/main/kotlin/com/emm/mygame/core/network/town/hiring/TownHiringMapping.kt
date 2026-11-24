package com.emm.mygame.core.network.town.hiring

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.PlaceHiringOrder
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.generated.models.TownOverviewHiring
import com.emm.mygame.core.network.generated.models.TownOverviewHiringOrder
import com.emm.mygame.core.network.generated.models.TownOverviewHiringTermsWorker
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.toKotlinInstant
import com.emm.mygame.core.network.platform.wireRefusal
import com.emm.mygame.core.network.town.toCosts
import retrofit2.Response

internal fun TownOverviewHiring.toHiring(): TownSnapshot.Hiring? {
    val open: TownSnapshot.HiringOrder? = order?.let { placed: TownOverviewHiringOrder ->
        placed.toHiringOrder() ?: return null
    }
    return TownSnapshot.Hiring(
        order = open,
        hires = mapOf(TownHireKind.Worker to hires.worker, TownHireKind.Truck to hires.truck),
        terms = mapOf(
            TownHireKind.Worker to terms.worker.toHireTerms(),
            TownHireKind.Truck to terms.truck.toHireTerms(),
        ),
    )
}

private fun TownOverviewHiringOrder.toHiringOrder(): TownSnapshot.HiringOrder? {
    val kind: TownHireKind = hire.toTownHireKind() ?: return null
    return TownSnapshot.HiringOrder(
        hire = kind,
        count = count,
        delivered = delivered,
        secondsPerHire = secondsPerHire,
        startedAt = startedAt.toKotlinInstant(),
        endsAt = endsAt.toKotlinInstant(),
    )
}

private fun TownOverviewHiringOrder.Hire.toTownHireKind(): TownHireKind? = when (this) {
    TownOverviewHiringOrder.Hire.worker -> TownHireKind.Worker
    TownOverviewHiringOrder.Hire.truck -> TownHireKind.Truck
    TownOverviewHiringOrder.Hire.unknown_default_open_api -> null
}

private fun TownOverviewHiringTermsWorker.toHireTerms(): TownSnapshot.HireTerms = TownSnapshot.HireTerms(
    costs = cost.toCosts(),
    secondsPerHire = secondsPerHire,
    people = people,
    requiredOfficeLevel = requiredOfficeLevel,
)

internal fun TownHireKind.toWireHire(): PlaceHiringOrder.Hire = when (this) {
    TownHireKind.Worker -> PlaceHiringOrder.Hire.worker
    TownHireKind.Truck -> PlaceHiringOrder.Hire.truck
}

internal fun hiringResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownHiringResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownHiringResult.Unreachable else TownHiringResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownHiringResult.Unreachable
    return TownHiringResult.Refused(refusal.toHiringRefusal())
}

private fun WireRefusal.toHiringRefusal(): TownHiringRefusal = when (this) {
    is WireRefusal.Bare ->
        if (kind == BareApiError.Kind.TownNotFound) TownHiringRefusal.TownNotFound else TownHiringRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toHiringRefusal()
}

private fun ApiError.toHiringRefusal(): TownHiringRefusal = when (this) {
    is ApiError.OfficetoolowWrapper -> TownHiringRefusal.OfficeTooLow(
        officeLevel = value.params.officeLevel,
        requiredOfficeLevel = value.params.requiredOfficeLevel,
    )
    is ApiError.HiringslotbusyWrapper -> TownHiringRefusal.HiringSlotBusy
    is ApiError.NotenoughpeopleWrapper ->
        TownHiringRefusal.NotEnoughPeople(required = value.params.requiredPeople, free = value.params.freePeople)
    is ApiError.NotenoughresourcesWrapper -> TownHiringRefusal.NotEnoughResources
    is ApiError.HiringordernotfoundWrapper -> TownHiringRefusal.HiringOrderNotFound
    else -> TownHiringRefusal.Unrecognized
}
