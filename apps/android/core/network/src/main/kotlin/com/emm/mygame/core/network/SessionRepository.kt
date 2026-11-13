package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CoroutineDispatcher

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun signUp(email: String, password: String, scaffold: PlayerScaffold): SignUpResult

    suspend fun requestPasswordReset(email: String): PasswordResetRequestResult

    suspend fun restore(): RestoreResult

    suspend fun resendVerification(): VerificationResendResult

    suspend fun signOut()
}

fun SessionRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    languages: PlayerLanguages,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): SessionRepository =
    ApiSessionRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        openingApi = accountApi(baseUrl = baseUrl),
        signOutApi = signOutApi(baseUrl = baseUrl, tokenStore = tokenStore, callTimeout = signOutTimeout),
        tokenStore = tokenStore,
        languages = languages,
        ioDispatcher = ioDispatcher,
    )

private val signOutTimeout: Duration = 5.seconds
