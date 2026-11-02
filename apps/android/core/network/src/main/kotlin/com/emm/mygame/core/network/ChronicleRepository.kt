package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface ChronicleRepository {

    suspend fun read(): ChronicleReadResult
}

fun ChronicleRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    ioDispatcher: CoroutineDispatcher,
): ChronicleRepository =
    ApiChronicleRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        ioDispatcher = ioDispatcher,
    )
