package com.emm.mygame.core.model.report

import com.emm.mygame.core.model.town.news.TownNewsReadResult

interface ReportRepository {

    suspend fun read(): ReportReadResult

    suspend fun close(): ReportCloseResult

    suspend fun news(): TownNewsReadResult
}
