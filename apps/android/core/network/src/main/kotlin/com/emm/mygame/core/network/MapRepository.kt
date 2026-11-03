package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface MapRepository {

    suspend fun readOwn(): MapReadResult

    suspend fun read(province: Int): MapReadResult
}

fun MapRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): MapRepository =
    ApiMapRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
