package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface ChronicleRepository {

    suspend fun read(fief: FiefId): ChronicleReadResult
}

fun ChronicleRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): ChronicleRepository =
    ApiChronicleRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
