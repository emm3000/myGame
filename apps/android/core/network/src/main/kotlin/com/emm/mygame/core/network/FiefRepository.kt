package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface FiefRepository {

    suspend fun read(): FiefReadResult
}

fun FiefRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): FiefRepository =
    ApiFiefRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        ioDispatcher = ioDispatcher,
    )
