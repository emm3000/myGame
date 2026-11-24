package com.emm.mygame.core.network

interface ReportRepository {

    suspend fun read(): ReportReadResult

    suspend fun close(): ReportCloseResult

    suspend fun news(): TownNewsReadResult
}
