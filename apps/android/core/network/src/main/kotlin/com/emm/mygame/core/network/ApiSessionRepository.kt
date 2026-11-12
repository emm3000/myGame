package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.ForgotPasswordRequest
import com.emm.mygame.core.network.generated.models.NativeSession
import com.emm.mygame.core.network.generated.models.Player
import com.emm.mygame.core.network.generated.models.SignInRequest
import com.emm.mygame.core.network.generated.models.SignUpRequest
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
    private val openingApi: DefaultApi,
    private val signOutApi: DefaultApi,
    private val tokenStore: TokenStore,
    private val ioDispatcher: CoroutineDispatcher,
) : SessionRepository {

    override suspend fun signIn(email: String, password: String): SignInResult =
        openingSession(unreachable = SignInResult.Unreachable) {
            signedInOrRefused(openingApi.authSignInNativePost(SignInRequest(email = email, password = password)))
        }

    override suspend fun signUp(email: String, password: String): SignUpResult =
        openingSession(unreachable = SignUpResult.Unreachable) {
            signedUpOrRefused(openingApi.authSignUpNativePost(SignUpRequest(email = email, password = password)))
        }

    override suspend fun requestPasswordReset(email: String): PasswordResetRequestResult =
        openingSession(unreachable = PasswordResetRequestResult.Unreachable) {
            requestedOrRefused(openingApi.authForgotPasswordPost(ForgotPasswordRequest(email = email)))
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

    override suspend fun resendVerification(): VerificationResendResult = withContext(ioDispatcher) {
        try {
            sentOrNotSent(api.authVerifyEmailResendPost())
        } catch (expectedOutage: IOException) {
            VerificationResendResult.Unreachable
        }
    }

    override suspend fun signOut(): Unit = withContext(ioDispatcher) {
        try {
            closeSession()
        } finally {
            tokenStore.clear()
        }
    }

    private suspend fun closeSession() {
        try {
            signOutApi.authSignOutPost()
        } catch (expectedOutage: IOException) {
        }
    }

    private suspend fun <T> openingSession(unreachable: T, open: suspend () -> T): T = withContext(ioDispatcher) {
        try {
            open()
        } catch (expectedOutage: IOException) {
            unreachable
        } catch (expectedMalformedBody: SerializationException) {
            unreachable
        } catch (expectedKeystoreRefusal: GeneralSecurityException) {
            unreachable
        } catch (expectedKeystoreFailure: ProviderException) {
            unreachable
        }
    }

    private fun signedUpOrRefused(response: Response<NativeSession>): SignUpResult {
        val session: NativeSession? = response.body()
        if (response.isSuccessful && session != null) {
            tokenStore.write(session.token)
            return SignUpResult.SignedIn(session.player.toSignedInPlayer())
        }
        if (response.code() !in clientErrorCodes) return SignUpResult.Unreachable
        return SignUpResult.Refused(response.wireRefusal()?.bareKind().toSignUpRefusal())
    }

    private fun signedInOrRefused(response: Response<NativeSession>): SignInResult {
        val session: NativeSession? = response.body()
        if (response.isSuccessful && session != null) {
            tokenStore.write(session.token)
            return SignInResult.SignedIn(session.player.toSignedInPlayer())
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return SignInResult.Unreachable
        return SignInResult.Refused(refusal.bareKind().toRefusalKind())
    }

    private fun requestedOrRefused(response: Response<Unit>): PasswordResetRequestResult = when (response.code()) {
        HttpURLConnection.HTTP_ACCEPTED -> PasswordResetRequestResult.Requested
        HttpURLConnection.HTTP_BAD_REQUEST -> PasswordResetRequestResult.MalformedEmail
        else -> PasswordResetRequestResult.Unreachable
    }

    private fun sentOrNotSent(response: Response<Unit>): VerificationResendResult = when (response.code()) {
        HttpURLConnection.HTTP_NO_CONTENT -> VerificationResendResult.Sent
        HttpURLConnection.HTTP_UNAVAILABLE -> VerificationResendResult.MailNotSent
        else -> VerificationResendResult.Unreachable
    }

    private fun restoredOrSignedOut(response: Response<Player>): RestoreResult {
        val player: Player? = response.body()
        return when {
            response.isSuccessful && player != null -> RestoreResult.SignedIn(player.toSignedInPlayer())
            response.code() == HttpURLConnection.HTTP_UNAUTHORIZED -> RestoreResult.SignedOut
            else -> RestoreResult.Unreachable
        }
    }
}

private fun BareApiError.Kind?.toRefusalKind(): RefusalKind =
    if (this == BareApiError.Kind.InvalidCredentials) RefusalKind.InvalidCredentials else RefusalKind.Unrecognized

private val clientErrorCodes: IntRange = HttpURLConnection.HTTP_BAD_REQUEST until HttpURLConnection.HTTP_INTERNAL_ERROR

private fun BareApiError.Kind?.toSignUpRefusal(): SignUpRefusal = when (this) {
    BareApiError.Kind.WeakPassword -> SignUpRefusal.WeakPassword
    BareApiError.Kind.EmailTaken -> SignUpRefusal.EmailTaken
    BareApiError.Kind.MalformedEmail -> SignUpRefusal.MalformedEmail
    else -> SignUpRefusal.Unrecognized
}

private fun Player.toSignedInPlayer(): SignedInPlayer = SignedInPlayer(email = email, isEmailVerified = emailVerified)
