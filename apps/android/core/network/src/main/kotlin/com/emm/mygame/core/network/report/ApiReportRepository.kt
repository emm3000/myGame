package com.emm.mygame.core.network.report

import com.emm.mygame.core.model.report.ReportCloseResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.Report
import com.emm.mygame.core.network.generated.models.TownNewsItems
import com.emm.mygame.core.network.reminder.StudyAnswers
import com.emm.mygame.core.network.reminder.StudyRequest
import com.emm.mygame.core.network.town.news.toTownNews
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import retrofit2.Response

internal class ApiReportRepository(
    private val api: DefaultApi,
    private val studyAnswers: StudyAnswers,
    private val ioDispatcher: CoroutineDispatcher,
) : ReportRepository {

    override suspend fun read(): ReportReadResult = withContext(ioDispatcher) {
        try {
            val study: StudyRequest = studyAnswers.sending()
            readOrUnreachable(api.reportGet(), study)
        } catch (expectedOutage: IOException) {
            ReportReadResult.Unreachable
        } catch (expectedMalformedBody: IllegalArgumentException) {
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
        } catch (expectedMalformedBody: IllegalArgumentException) {
            TownNewsReadResult.Unreachable
        }
    }

    private fun newsOrUnreachable(response: Response<TownNewsItems>): TownNewsReadResult {
        val news: TownNewsItems = response.body() ?: return TownNewsReadResult.Unreachable
        return TownNewsReadResult.Read(news.toTownNews())
    }

    private fun readOrUnreachable(response: Response<Report>, study: StudyRequest): ReportReadResult {
        val report: TownReport = response.body()?.toTownReport() ?: return ReportReadResult.Unreachable
        studyAnswers.reportAnswered(study, report)
        return ReportReadResult.Read(report)
    }
}
