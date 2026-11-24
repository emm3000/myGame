package com.emm.mygame.core.network.town.hiring

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.wireRefusal
import retrofit2.Response

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
