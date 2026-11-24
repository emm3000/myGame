package com.emm.mygame.core.network.town.building

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.NotEnoughWordsErrorParams
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.wireRefusal
import retrofit2.Response

internal fun workResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownWorkResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownWorkResult.Unreachable else TownWorkResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownWorkResult.Unreachable
    return TownWorkResult.Refused(refusal.toWorkRefusal())
}

private fun WireRefusal.toWorkRefusal(): TownWorkRefusal = when (this) {
    is WireRefusal.Bare ->
        if (kind == BareApiError.Kind.TownNotFound) TownWorkRefusal.TownNotFound else TownWorkRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toWorkRefusal()
}

private fun ApiError.toWorkRefusal(): TownWorkRefusal = when (this) {
    is ApiError.WaitinglistfullWrapper -> TownWorkRefusal.WaitingListFull(value.params.cap)
    is ApiError.ToplevelreachedWrapper -> TownWorkRefusal.TopLevelReached(value.params.level)
    is ApiError.NotenoughpeopleWrapper ->
        TownWorkRefusal.NotEnoughPeople(required = value.params.requiredPeople, free = value.params.freePeople)
    is ApiError.NotenoughwordsWrapper -> value.params.toWorkRefusal()
    is ApiError.NotenoughresourcesWrapper -> TownWorkRefusal.NotEnoughResources
    is ApiError.BuildingworknotfoundWrapper -> TownWorkRefusal.BuildingWorkNotFound(value.params.level)
    else -> TownWorkRefusal.Unrecognized
}

private fun NotEnoughWordsErrorParams.toWorkRefusal(): TownWorkRefusal {
    val kind: NeededWordKind = standing.toNeededWordKind() ?: return TownWorkRefusal.Unrecognized
    return TownWorkRefusal.NotEnoughWords(needed, held, kind)
}
