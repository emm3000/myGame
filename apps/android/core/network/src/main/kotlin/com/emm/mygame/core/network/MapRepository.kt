package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface MapRepository {

    suspend fun readOwn(): MapReadResult

    suspend fun read(province: Int): MapReadResult
}

fun MapRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): MapRepository =
    ApiMapRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        ioDispatcher = ioDispatcher,
    )
