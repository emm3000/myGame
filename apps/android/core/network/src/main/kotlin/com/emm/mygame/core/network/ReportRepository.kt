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
    ReportRepository(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClientBuilder = okHttpDefaults),
        tokenStore = tokenStore,
        sessionEnds = sessionEnds,
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )

internal fun ReportRepository(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
): ReportRepository =
    ApiReportRepository(
        api = signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds),
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )
