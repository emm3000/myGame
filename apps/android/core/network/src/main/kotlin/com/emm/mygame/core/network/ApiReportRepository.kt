package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.Report
import com.emm.mygame.core.network.generated.models.TownNewsFeed
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiReportRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : ReportRepository {

    override suspend fun read(): ReportReadResult = withContext(ioDispatcher) {
        try {
            readOrUnreachable(api.reportGet())
        } catch (expectedOutage: IOException) {
            ReportReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            ReportReadResult.Unreachable
        }
    }

    override suspend fun close(): ReportCloseResult = withContext(ioDispatcher) {
        try {
            if (api.reportClosePost().isSuccessful) ReportCloseResult.Closed else ReportCloseResult.Unreachable
        } catch (expectedOutage: IOException) {
            ReportCloseResult.Unreachable
        }
    }

    override suspend fun news(): TownNewsReadResult = withContext(ioDispatcher) {
        try {
            newsOrUnreachable(api.townNewsGet())
        } catch (expectedOutage: IOException) {
            TownNewsReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            TownNewsReadResult.Unreachable
        }
    }

    private fun newsOrUnreachable(response: Response<TownNewsFeed>): TownNewsReadResult {
        val feed: TownNewsFeed = response.body() ?: return TownNewsReadResult.Unreachable
        return TownNewsReadResult.Read(feed.toTownNews())
    }

    private fun readOrUnreachable(response: Response<Report>): ReportReadResult {
        val report: Report = response.body() ?: return ReportReadResult.Unreachable
        return ReportReadResult.Read(report.toTownReport())
    }
}
