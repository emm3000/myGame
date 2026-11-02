package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CoroutineDispatcher

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun restore(): RestoreResult

    suspend fun signOut()
}

fun SessionRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): SessionRepository =
    ApiSessionRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        signOutApi = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore, callTimeout = signOutTimeout),
        tokenStore = tokenStore,
        ioDispatcher = ioDispatcher,
    )

private val signOutTimeout: Duration = 5.seconds
