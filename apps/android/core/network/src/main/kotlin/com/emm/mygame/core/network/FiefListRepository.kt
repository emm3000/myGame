package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface FiefListRepository {

    suspend fun firstListed(): FirstFiefResult

    suspend fun listed(): FiefListResult
}

fun FiefListRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): FiefListRepository =
    ApiFiefListRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
