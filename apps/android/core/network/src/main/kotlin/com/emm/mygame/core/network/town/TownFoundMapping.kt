package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.town.TownFoundRefusal
import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.bareKind
import com.emm.mygame.core.network.platform.wireRefusal
import retrofit2.Response

internal fun foundResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownFoundResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownFoundResult.Unreachable else TownFoundResult.Founded(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownFoundResult.Unreachable
    return TownFoundResult.Refused(refusal.toFoundRefusal())
}

private fun WireRefusal.toFoundRefusal(): TownFoundRefusal = when (bareKind()) {
    BareApiError.Kind.BlankTownName -> TownFoundRefusal.BlankTownName
    BareApiError.Kind.PlayerAlreadyHoldsTown -> TownFoundRefusal.PlayerAlreadyHoldsTown
    else -> TownFoundRefusal.Unrecognized
}
