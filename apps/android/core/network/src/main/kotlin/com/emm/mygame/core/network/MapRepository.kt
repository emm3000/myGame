package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface MapRepository {

    suspend fun readOwn(fief: FiefId): MapReadResult

    suspend fun read(fief: FiefId, province: Int): MapReadResult
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
