package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.infrastructure.Serializer
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.NativeSession
import com.emm.mygame.core.network.generated.models.Player
import com.emm.mygame.core.network.generated.models.SignInRequest
import java.io.IOException
import java.net.HttpURLConnection
import java.security.GeneralSecurityException
import java.security.ProviderException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiSessionRepository(
    private val api: DefaultApi,
    private val tokenStore: TokenStore,
    private val ioDispatcher: CoroutineDispatcher,
) : SessionRepository {

    override suspend fun signIn(email: String, password: String): SignInResult = withContext(ioDispatcher) {
        try {
            signedInOrRefused(api.authSignInNativePost(SignInRequest(email = email, password = password)))
        } catch (expectedOutage: IOException) {
            SignInResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            SignInResult.Unreachable
        } catch (expectedKeystoreRefusal: GeneralSecurityException) {
            SignInResult.Unreachable
        } catch (expectedKeystoreFailure: ProviderException) {
            SignInResult.Unreachable
        }
    }

    override suspend fun restore(): RestoreResult = withContext(ioDispatcher) {
        if (tokenStore.read() == null) {
            RestoreResult.SignedOut
        } else {
            try {
                restoredOrSignedOut(api.authSessionGet())
            } catch (expectedOutage: IOException) {
                RestoreResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                RestoreResult.Unreachable
            }
        }
    }

    private fun signedInOrRefused(response: Response<NativeSession>): SignInResult {
        val session: NativeSession? = response.body()
        if (response.isSuccessful && session != null) {
            tokenStore.write(session.token)
            return SignInResult.SignedIn(session.player.toSignedInPlayer())
        }
        val refusal: ApiError = response.apiError() ?: return SignInResult.Unreachable
        return SignInResult.Refused(refusal.kind.toRefusalKind())
    }

    private fun restoredOrSignedOut(response: Response<Player>): RestoreResult {
        val player: Player? = response.body()
        return when {
            response.isSuccessful && player != null -> RestoreResult.SignedIn(player.toSignedInPlayer())
            response.code() == HttpURLConnection.HTTP_UNAUTHORIZED -> {
                tokenStore.clear()
                RestoreResult.SignedOut
            }
            else -> RestoreResult.Unreachable
        }
    }
}

private fun Response<*>.apiError(): ApiError? {
    val body: String = errorBody()?.string() ?: return null
    return try {
        Serializer.kotlinxSerializationJson.decodeFromString(ApiError.serializer(), body)
    } catch (expectedMalformedBody: SerializationException) {
        null
    }
}

private fun ApiError.Kind.toRefusalKind(): RefusalKind =
    if (this == ApiError.Kind.InvalidCredentials) RefusalKind.InvalidCredentials else RefusalKind.Unrecognized

private fun Player.toSignedInPlayer(): SignedInPlayer = SignedInPlayer(email = email)
