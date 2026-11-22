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
    TownTextRepository(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClient = okHttpDefaults),
        tokenStore = tokenStore,
        sessionEnds = sessionEnds,
        ioDispatcher = ioDispatcher,
    )

internal fun TownTextRepository(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): TownTextRepository =
    ApiTownTextRepository(
        api = signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
