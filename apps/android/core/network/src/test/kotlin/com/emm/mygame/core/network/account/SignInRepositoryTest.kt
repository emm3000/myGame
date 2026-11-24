package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RefusalKind
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.SignInResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.network.FakeTokenCipher
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.takeRequestWithin
import java.security.GeneralSecurityException
import java.security.ProviderException
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SignInRepositoryTest : SessionRepositoryFixture() {

    @Test
    fun `signs in as the player the api names`() = runTest {
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))

        val result: SignInResult = repository(tokenStore()).signIn("ines@sotoverde.es", "contrasena")

        assertEquals(
            SignInResult.SignedIn(
                SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
            result,
        )
    }

    @Test
    fun `sends the signed-in token as a bearer on the next request`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))
        api.enqueue(player(email = "ines@sotoverde.es"))
        sessions.signIn("ines@sotoverde.es", "contrasena")

        sessions.restore()

        api.takeRequestWithin()
        val sessionRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("Bearer opaque-session", sessionRequest.headers["Authorization"])
    }

    @Test
    fun `signs in without a bearer while a token is still stored`() = runTest {
        val store: TokenStore = tokenStore().apply { write("stale-session") }
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))

        repository(store).signIn("ines@sotoverde.es", "contrasena")

        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `carries the token of a sign-in that follows an unreachable restore`() = runTest {
        val store: TokenStore = tokenStore().apply { write("stale-session") }
        val sessions: SessionRepository = repository(store)
        api.enqueue(MockResponse.Builder().code(503).build())
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))
        api.enqueue(player(email = "ines@sotoverde.es"))
        sessions.restore()

        sessions.signIn("ines@sotoverde.es", "contrasena")
        sessions.restore()

        api.takeRequestWithin()
        api.takeRequestWithin()
        assertEquals("opaque-session", store.read())
        assertEquals("Bearer opaque-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `asks the api under the base path it was given`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))
        api.enqueue(player(email = "ines@sotoverde.es"))
        sessions.signIn("ines@sotoverde.es", "contrasena")

        sessions.restore()

        assertEquals("/api/auth/sign-in/native", api.takeRequestWithin().url.encodedPath)
        assertEquals("/api/auth/session", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `answers unreachable when the keystore provider cannot seal the token`() = runTest {
        val sealFailure: ProviderException = ProviderException("The keystore could not encrypt")
        val store: TokenStore = tokenStore(FakeTokenCipher(encryptFailure = sealFailure))
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))

        val result: SignInResult = repository(store).signIn("ines@sotoverde.es", "contrasena")

        assertEquals(SignInResult.Unreachable, result)
        assertNull(store.read())
    }

    @Test
    fun `answers unreachable when the keystore refuses to seal the token`() = runTest {
        val sealFailure: GeneralSecurityException = GeneralSecurityException("The keystore refused the key")
        val store: TokenStore = tokenStore(FakeTokenCipher(encryptFailure = sealFailure))
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))

        val result: SignInResult = repository(store).signIn("ines@sotoverde.es", "contrasena")

        assertEquals(SignInResult.Unreachable, result)
        assertNull(store.read())
    }

    @Test
    fun `answers the refusal the api names`() = runTest {
        api.enqueue(refusal(kind = "InvalidCredentials"))

        val result: SignInResult = repository(tokenStore()).signIn("ines@sotoverde.es", "equivocada")

        assertEquals(SignInResult.Refused(RefusalKind.InvalidCredentials), result)
    }

    @Test
    fun `answers an unrecognized refusal for a kind sign-in does not name`() = runTest {
        api.enqueue(refusal(kind = "MailNotSent"))

        val result: SignInResult = repository(tokenStore()).signIn("ines@sotoverde.es", "contrasena")

        assertEquals(SignInResult.Refused(RefusalKind.Unrecognized), result)
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.close()

        val result: SignInResult = sessions.signIn("ines@sotoverde.es", "contrasena")

        assertEquals(SignInResult.Unreachable, result)
    }
}
