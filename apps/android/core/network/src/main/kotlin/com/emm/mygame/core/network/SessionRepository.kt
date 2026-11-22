package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CoroutineDispatcher

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun signUp(email: String, password: String, scaffold: PlayerScaffold): SignUpResult

    suspend fun requestPasswordReset(email: String): PasswordResetRequestResult

    suspend fun resetPassword(token: PasswordResetToken, password: String): PasswordResetResult

    suspend fun verifyEmail(token: EmailVerificationToken): EmailVerificationResult

    suspend fun restore(): RestoreResult

    suspend fun resendVerification(): VerificationResendResult

    suspend fun changeScaffold(scaffold: PlayerScaffold): ScaffoldChangeResult

    suspend fun signOut()
}

fun SessionRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    languages: PlayerLanguages,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): SessionRepository =
    SessionRepository(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClientBuilder = okHttpDefaults),
        tokenStore = tokenStore,
        languages = languages,
        sessionEnds = sessionEnds,
        ioDispatcher = ioDispatcher,
    )

internal fun SessionRepository(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    languages: PlayerLanguages,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): SessionRepository =
    ApiSessionRepository(
        api = signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds),
        openingApi = accountApi(endpoint = endpoint),
        signOutApi = signOutApi(endpoint = endpoint, tokenStore = tokenStore, callTimeout = signOutTimeout),
        tokenStore = tokenStore,
        languages = languages,
        ioDispatcher = ioDispatcher,
    )

private val signOutTimeout: Duration = 5.seconds
