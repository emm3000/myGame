package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import java.security.GeneralSecurityException
import java.security.ProviderException
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class SessionRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `signs in as the player the api names`() = runTest {
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))

        val result: SignInResult = repository(tokenStore()).signIn("ines@sotoverde.es", "contrasena")

        assertEquals(SignInResult.SignedIn(SignedInPlayer(email = "ines@sotoverde.es")), result)
    }

    @Test
    fun `sends the signed-in token as a bearer on the next request`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))
        api.enqueue(player(email = "ines@sotoverde.es"))
        sessions.signIn("ines@sotoverde.es", "contrasena")

        sessions.restore()

        api.takeRequest()
        val sessionRequest: RecordedRequest = api.takeRequest()
        assertEquals("Bearer opaque-session", sessionRequest.headers["Authorization"])
    }

    @Test
    fun `asks the api under the base path it was given`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))
        api.enqueue(player(email = "ines@sotoverde.es"))
        sessions.signIn("ines@sotoverde.es", "contrasena")

        sessions.restore()

        assertEquals("/api/auth/sign-in/native", api.takeRequest().url.encodedPath)
        assertEquals("/api/auth/session", api.takeRequest().url.encodedPath)
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

    @Test
    fun `restores the player the stored token's session names`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(player(email = "ines@sotoverde.es"))

        val result: RestoreResult = repository(store).restore()

        assertEquals(RestoreResult.SignedIn(SignedInPlayer(email = "ines@sotoverde.es")), result)
    }

    @Test
    fun `clears the stored token when the api refuses it`() = runTest {
        val store: TokenStore = tokenStore().apply { write("expired-session") }
        api.enqueue(MockResponse.Builder().code(401).build())

        val result: RestoreResult = repository(store).restore()

        assertEquals(RestoreResult.SignedOut, result)
        assertNull(store.read())
    }

    @Test
    fun `answers signed out without asking the api when no token is stored`() = runTest {
        val result: RestoreResult = repository(tokenStore()).restore()

        assertEquals(RestoreResult.SignedOut, result)
        assertEquals(0, api.requestCount)
    }

    @Test
    fun `keeps the stored token when the api cannot be reached on restore`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        val sessions: SessionRepository = repository(store)
        api.close()

        val result: RestoreResult = sessions.restore()

        assertEquals(RestoreResult.Unreachable, result)
        assertEquals("opaque-session", store.read())
    }

    private fun TestScope.repository(store: TokenStore): SessionRepository =
        SessionRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

    private fun tokenStore(): TokenStore = tokenStore(FakeTokenCipher())

    private fun tokenStore(cipher: FakeTokenCipher): TokenStore = TokenStore(File(folder.root, "session"), cipher)

    private fun nativeSession(token: String, email: String): MockResponse =
        json(200, """{"token":"$token","player":${playerJson(email)}}""")

    private fun player(email: String): MockResponse = json(200, playerJson(email))

    private fun refusal(kind: String): MockResponse =
        json(401, """{"kind":"$kind","message":"El correo o la contraseña no son correctos."}""")

    private fun playerJson(email: String): String =
        """{"id":"0b6f2f2e-6a43-4a8e-9c4e-2f1d3c4b5a69","email":"$email","emailVerified":true,"seenHints":[]}"""

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()
}
