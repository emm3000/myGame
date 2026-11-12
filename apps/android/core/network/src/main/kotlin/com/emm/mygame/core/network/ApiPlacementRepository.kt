package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.PlacementAnswers
import java.io.IOException
import java.net.HttpURLConnection
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import retrofit2.Response
import com.emm.mygame.core.network.generated.models.Placement as WirePlacement

internal class ApiPlacementRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : PlacementRepository {

    override suspend fun read(): PlacementReadResult = withContext(ioDispatcher) {
        try {
            api.placementGet().placementOrNull()?.let(PlacementReadResult::Read) ?: PlacementReadResult.Unreachable
        } catch (expectedOutage: IOException) {
            PlacementReadResult.Unreachable
        } catch (expectedMalformedBody: IllegalArgumentException) {
            PlacementReadResult.Unreachable
        }
    }

    override suspend fun begin(): PlacementChangeResult = change { api.placementPost() }

    override suspend fun skip(): PlacementChangeResult = change { api.placementSkipPost() }

    override suspend fun answer(band: PlacementBand, answers: List<PlacementAnswer>): PlacementChangeResult =
        change {
            api.placementAnswersPost(PlacementAnswers(band = band.toWire(), answers = answers.map { it.toWire() }))
        }

    private suspend fun change(send: suspend () -> Response<WirePlacement>): PlacementChangeResult =
        withContext(ioDispatcher) {
            try {
                changeOf(send())
            } catch (expectedOutage: IOException) {
                PlacementChangeResult.Unreachable
            } catch (expectedMalformedBody: IllegalArgumentException) {
                PlacementChangeResult.Unreachable
            }
        }

    private fun changeOf(response: Response<WirePlacement>): PlacementChangeResult {
        if (response.code() in refusedStatuses) return PlacementChangeResult.Refused
        val placement: Placement = response.placementOrNull() ?: return PlacementChangeResult.Unreachable
        return PlacementChangeResult.Changed(placement)
    }

    private fun Response<WirePlacement>.placementOrNull(): Placement? = body()?.toPlacement()

    private companion object {
        val refusedStatuses: Set<Int> = setOf(HttpURLConnection.HTTP_BAD_REQUEST, HttpURLConnection.HTTP_CONFLICT)
    }
}
