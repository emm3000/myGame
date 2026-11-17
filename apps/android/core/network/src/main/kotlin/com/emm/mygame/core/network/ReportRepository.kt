package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface ReportRepository {

    suspend fun read(): ReportReadResult

    suspend fun close(): ReportCloseResult

    suspend fun news(): TownNewsReadResult
}

fun ReportRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
): ReportRepository =
    ApiReportRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )
