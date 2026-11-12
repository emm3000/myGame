package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface PlacementRepository {

    suspend fun read(): PlacementReadResult

    suspend fun begin(): PlacementChangeResult

    suspend fun skip(): PlacementChangeResult

    suspend fun answer(band: PlacementBand, answers: List<PlacementAnswer>): PlacementChangeResult
}

fun PlacementRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): PlacementRepository =
    ApiPlacementRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
