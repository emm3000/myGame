package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.EmailVerificationResult
import com.emm.mygame.core.model.account.EmailVerificationToken
import com.emm.mygame.core.model.account.PasswordResetRequestResult
import com.emm.mygame.core.model.account.PasswordResetResult
import com.emm.mygame.core.model.account.PasswordResetToken
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RefusalKind
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.ScaffoldChangeResult
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.SignInResult
import com.emm.mygame.core.model.account.SignUpRefusal
import com.emm.mygame.core.model.account.SignUpResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.account.VerificationResendResult
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.ForgotPasswordRequest
import com.emm.mygame.core.network.generated.models.NativeSession
import com.emm.mygame.core.network.generated.models.Player
import com.emm.mygame.core.network.generated.models.ResetPasswordRequest
import com.emm.mygame.core.network.generated.models.ScaffoldChange
import com.emm.mygame.core.network.generated.models.SignInRequest
import com.emm.mygame.core.network.generated.models.SignUpRequest
import com.emm.mygame.core.network.generated.models.VerifyEmailRequest
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.bareKind
import com.emm.mygame.core.network.platform.signOutApi
import com.emm.mygame.core.network.platform.wireRefusal
import java.io.IOException
import java.net.HttpURLConnection
import java.security.GeneralSecurityException
import java.security.ProviderException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiSessionRepository(
    private val api: DefaultApi,
    private val openingApi: DefaultApi,
    private val signOutApi: DefaultApi,
    private val tokenStore: TokenStore,
    private val languages: PlayerLanguages,
    private val ioDispatcher: CoroutineDispatcher,
) : SessionRepository {

    override suspend fun signIn(email: String, password: String): SignInResult =
        openingSession(unreachable = SignInResult.Unreachable) {
            signedInOrRefused(openingApi.authSignInNativePost(SignInRequest(email = email, password = password)))
        }

    override suspend fun signUp(email: String, password: String, scaffold: PlayerScaffold): SignUpResult =
        openingSession(unreachable = SignUpResult.Unreachable) {
            val request: SignUpRequest =
                SignUpRequest(email = email, password = password, scaffold = scaffold.toScaffold())
            signedUpOrRefused(openingApi.authSignUpNativePost(request))
        }

    override suspend fun requestPasswordReset(email: String): PasswordResetRequestResult =
        openingSession(unreachable = PasswordResetRequestResult.Unreachable) {
            requestedOrRefused(openingApi.authForgotPasswordPost(ForgotPasswordRequest(email = email)))
        }

    override suspend fun resetPassword(token: PasswordResetToken, password: String): PasswordResetResult =
        openingSession(unreachable = PasswordResetResult.Unreachable) {
            val request: ResetPasswordRequest = ResetPasswordRequest(token = token.value, password = password)
            changedOrRefused(openingApi.authResetPasswordPost(request))
        }

    override suspend fun verifyEmail(token: EmailVerificationToken): EmailVerificationResult =
        openingSession(unreachable = EmailVerificationResult.Unreachable) {
            verifiedOrRefused(openingApi.authVerifyEmailPost(VerifyEmailRequest(token = token.value)))
        }

    override suspend fun restore(): RestoreResult = withContext(ioDispatcher) {
        if (tokenStore.read() == null) {
            RestoreResult.SignedOut
        } else {
            try {
                val read: LanguageRead = languages.sending()
                restoredOrSignedOut(api.authSessionGet(), read)
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

    override suspend fun changeScaffold(scaffold: PlayerScaffold): ScaffoldChangeResult =
        withContext(ioDispatcher + NonCancellable) {
            try {
                val read: LanguageRead = languages.sending()
                changedOrRefused(api.playerScaffoldPut(ScaffoldChange(scaffold = scaffold.toScaffold())), read)
            } catch (expectedOutage: IOException) {
                ScaffoldChangeResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                ScaffoldChangeResult.Unreachable
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
            languages.answered(languages.sending(), session.player)
            return SignUpResult.SignedIn(session.player.toSignedInPlayer())
        }
        if (response.code() !in clientErrorCodes) return SignUpResult.Unreachable
        return SignUpResult.Refused(response.wireRefusal()?.bareKind().toSignUpRefusal())
    }

    private fun signedInOrRefused(response: Response<NativeSession>): SignInResult {
        val session: NativeSession? = response.body()
        if (response.isSuccessful && session != null) {
            tokenStore.write(session.token)
            languages.answered(languages.sending(), session.player)
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

    private fun changedOrRefused(response: Response<Unit>): PasswordResetResult {
        if (response.code() == HttpURLConnection.HTTP_NO_CONTENT) {
            tokenStore.clear()
            return PasswordResetResult.Changed
        }
        if (response.code() != HttpURLConnection.HTTP_BAD_REQUEST) return PasswordResetResult.Unreachable
        return response.wireRefusal()?.bareKind().toPasswordResetRefusal()
    }

    private fun verifiedOrRefused(response: Response<Unit>): EmailVerificationResult {
        if (response.code() == HttpURLConnection.HTTP_NO_CONTENT) return EmailVerificationResult.Verified
        if (response.code() != HttpURLConnection.HTTP_BAD_REQUEST) return EmailVerificationResult.Unreachable
        val isTokenRefused: Boolean = response.wireRefusal()?.bareKind() == BareApiError.Kind.TokenInvalid
        return if (isTokenRefused) EmailVerificationResult.LinkRefused else EmailVerificationResult.Unreachable
    }

    private fun sentOrNotSent(response: Response<Unit>): VerificationResendResult = when (response.code()) {
        HttpURLConnection.HTTP_NO_CONTENT -> VerificationResendResult.Sent
        HttpURLConnection.HTTP_UNAVAILABLE -> VerificationResendResult.MailNotSent
        else -> VerificationResendResult.Unreachable
    }

    private fun changedOrRefused(response: Response<Player>, read: LanguageRead): ScaffoldChangeResult {
        val player: Player? = response.body()
        if (response.isSuccessful && player != null) {
            languages.answered(read, player)
            return ScaffoldChangeResult.Changed(player.toSignedInPlayer())
        }
        if (response.code() == HttpURLConnection.HTTP_BAD_REQUEST) return ScaffoldChangeResult.Refused
        return ScaffoldChangeResult.Unreachable
    }

    private fun restoredOrSignedOut(response: Response<Player>, read: LanguageRead): RestoreResult {
        val player: Player? = response.body()
        return when {
            response.isSuccessful && player != null -> {
                languages.answered(read, player)
                RestoreResult.SignedIn(player.toSignedInPlayer())
            }
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

private fun BareApiError.Kind?.toPasswordResetRefusal(): PasswordResetResult = when (this) {
    BareApiError.Kind.TokenInvalid -> PasswordResetResult.LinkRefused
    BareApiError.Kind.WeakPassword -> PasswordResetResult.WeakPassword
    else -> PasswordResetResult.Unreachable
}

private fun PlayerLanguages.answered(read: LanguageRead, player: Player) {
    answered(
        read,
        LanguageAnswer(
            scaffold = player.scaffold.toPlayerScaffold(),
            scaffoldVersion = ScaffoldVersion(player.scaffoldVersion),
            chromePhase = player.chromePhase.toPlayerChromePhase(),
        ),
    )
}

private fun Player.toSignedInPlayer(): SignedInPlayer =
    SignedInPlayer(email = email, isEmailVerified = emailVerified, scaffold = scaffold.toPlayerScaffold())
