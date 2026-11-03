package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CoroutineDispatcher

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun signUp(email: String, password: String, fiefName: String): SignUpResult

    suspend fun restore(): RestoreResult

    suspend fun signOut()
}

fun SessionRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): SessionRepository =
    ApiSessionRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        openingApi = authApi(baseUrl = baseUrl, tokenStore = tokenStore, callTimeout = Duration.ZERO),
        signOutApi = authApi(baseUrl = baseUrl, tokenStore = tokenStore, callTimeout = signOutTimeout),
        tokenStore = tokenStore,
        ioDispatcher = ioDispatcher,
    )

private val signOutTimeout: Duration = 5.seconds
