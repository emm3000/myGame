package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.HoldoutCheckAnswers
import com.emm.mygame.core.network.generated.models.HoldoutChecks
import java.io.IOException
import java.net.HttpURLConnection
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import retrofit2.Response

internal class ApiHoldoutCheckRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : HoldoutCheckRepository {

    override suspend fun read(): HoldoutChecksReadResult = withContext(ioDispatcher) {
        try {
            api.holdoutChecksGet().checksOrNull()?.let(HoldoutChecksReadResult::Read)
                ?: HoldoutChecksReadResult.Unreachable
        } catch (expectedOutage: IOException) {
            HoldoutChecksReadResult.Unreachable
        } catch (expectedMalformedBody: IllegalArgumentException) {
            HoldoutChecksReadResult.Unreachable
        }
    }

    override suspend fun begin(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult =
        change { api.holdoutChecksBandWeekPost(band.pathOf(), week.pathOf()) }

    override suspend fun skip(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult =
        change { api.holdoutChecksBandWeekSkipPost(band.pathOf(), week.pathOf()) }

    override suspend fun answer(
        band: PlacementBand,
        week: HoldoutCheckWeek,
        answers: List<PlacementAnswer>,
    ): HoldoutCheckChangeResult = change {
        api.holdoutChecksBandWeekAnswersPost(
            band.pathOf(),
            week.pathOf(),
            HoldoutCheckAnswers(answers = answers.map { it.toWire() }),
        )
    }

    private suspend fun change(send: suspend () -> Response<HoldoutChecks>): HoldoutCheckChangeResult =
        withContext(ioDispatcher) {
            try {
                changeOf(send())
            } catch (expectedOutage: IOException) {
                HoldoutCheckChangeResult.Unreachable
            } catch (expectedMalformedBody: IllegalArgumentException) {
                HoldoutCheckChangeResult.Unreachable
            }
        }

    private fun changeOf(response: Response<HoldoutChecks>): HoldoutCheckChangeResult {
        val refusal: HoldoutCheckRefusal? = refusals[response.code()]
        if (refusal != null) return HoldoutCheckChangeResult.Refused(refusal)
        val checks: List<HoldoutCheck> = response.checksOrNull() ?: return HoldoutCheckChangeResult.Unreachable
        return HoldoutCheckChangeResult.Changed(checks)
    }

    private fun Response<HoldoutChecks>.checksOrNull(): List<HoldoutCheck>? = body()?.toChecks()

    private fun PlacementBand.pathOf(): String = number.toString()

    private fun HoldoutCheckWeek.pathOf(): String = number.toString()

    private companion object {
        val refusals: Map<Int, HoldoutCheckRefusal> = mapOf(
            HttpURLConnection.HTTP_CONFLICT to HoldoutCheckRefusal.NotOpen,
            HttpURLConnection.HTTP_BAD_REQUEST to HoldoutCheckRefusal.InvalidRequest,
        )
    }
}
