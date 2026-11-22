package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface HoldoutCheckRepository {

    suspend fun read(): HoldoutChecksReadResult

    suspend fun begin(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult

    suspend fun skip(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult

    suspend fun answer(
        band: PlacementBand,
        week: HoldoutCheckWeek,
        answers: List<PlacementAnswer>,
    ): HoldoutCheckChangeResult
}

fun HoldoutCheckRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
): HoldoutCheckRepository =
    HoldoutCheckRepository(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClientBuilder = okHttpDefaults),
        tokenStore = tokenStore,
        sessionEnds = sessionEnds,
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )

internal fun HoldoutCheckRepository(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
): HoldoutCheckRepository =
    ApiHoldoutCheckRepository(
        api = signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds),
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )
