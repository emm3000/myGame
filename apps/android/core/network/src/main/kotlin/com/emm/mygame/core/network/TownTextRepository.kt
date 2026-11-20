package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface TownTextRepository {

    suspend fun readText(text: TextId): TownTextResult
}

fun TownTextRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): TownTextRepository =
    ApiTownTextRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
