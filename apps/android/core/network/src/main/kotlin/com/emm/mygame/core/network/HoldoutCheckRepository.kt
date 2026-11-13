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
    ioDispatcher: CoroutineDispatcher,
): HoldoutCheckRepository =
    ApiHoldoutCheckRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
