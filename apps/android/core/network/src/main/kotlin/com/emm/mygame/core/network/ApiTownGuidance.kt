package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import retrofit2.Response

internal class ApiTownGuidance(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : TownGuidanceRepository {

    override suspend fun markTipSeen(tip: TipKind): TownGuidanceResult =
        guiding { api.townTipsTipPost(tip = tip.toWireTip()) }

    override suspend fun dismissGuidance(): TownGuidanceResult = guiding { api.townGuidanceDismissalPost() }

    private suspend fun guiding(call: suspend () -> Response<Unit>): TownGuidanceResult = withContext(ioDispatcher) {
        try {
            if (call().isSuccessful) TownGuidanceResult.Marked else TownGuidanceResult.Unreachable
        } catch (expectedOutage: IOException) {
            TownGuidanceResult.Unreachable
        }
    }
}
