package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun restore(): RestoreResult
}

fun SessionRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): SessionRepository =
    ApiSessionRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        tokenStore = tokenStore,
        ioDispatcher = ioDispatcher,
    )
