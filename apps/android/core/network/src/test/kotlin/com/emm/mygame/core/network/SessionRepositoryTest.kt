package com.emm.mygame.core.network

import app.cash.turbine.test
import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import java.security.GeneralSecurityException
import java.security.ProviderException
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import mockwebserver3.SocketEffect
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class SessionRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val signedInFief: FiefId = FiefId("509eadd5-6b34-4ea3-8e91-2b38744bd385")

    private val sessionEnds: SessionEnds = SessionEnds()

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
    fun `ends the session when the restore answers 401`() = runTest {
        val sessions: SessionRepository = repository(tokenStore().apply { write("expired-session") })
        api.enqueue(MockResponse.Builder().code(401).build())

        sessionEnds.ended.test {
            sessions.restore()

            awaitItem()
        }
    }

    @Test
    fun `keeps the session on a refused sign-in`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        val sessions: SessionRepository = repository(store)
        api.enqueue(refusal(kind = "InvalidCredentials"))

        sessionEnds.ended.test {
            sessions.signIn("ines@sotoverde.es", "equivocada")

            expectNoEvents()
            assertEquals("opaque-session", store.read())
        }
    }

    @Test
    fun `reports no end when sign-out answers 401`() = runTest {
        val sessions: SessionRepository = repository(tokenStore().apply { write("expired-session") })
        api.enqueue(MockResponse.Builder().code(401).build())

        sessionEnds.ended.test {
            sessions.signOut()

            expectNoEvents()
        }
    }

    @Test
    fun `asks the api nothing on restore once a read has ended the session`() = runTest {
        val store: TokenStore = tokenStore().apply { write("expired-session") }
        api.enqueue(MockResponse.Builder().code(401).build())
        fiefRepository(store).read(signedInFief)

        val result: RestoreResult = repository(store).restore()

        assertEquals(RestoreResult.SignedOut, result)
        assertEquals(1, api.requestCount)
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

    @Test
    fun `posts the stored token as a bearer to sign-out`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(store).signOut()

        val signOutRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST", signOutRequest.method)
        assertEquals("/api/auth/sign-out", signOutRequest.url.encodedPath)
        assertEquals("Bearer opaque-session", signOutRequest.headers["Authorization"])
    }

    @Test
    fun `deletes the ciphertext file once the api closes the session`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(store).signOut()

        assertFalse(sessionFile().exists())
    }

    @Test
    fun `forgets the token even when the api is unreachable`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        val sessions: SessionRepository = repository(store)
        api.close()

        sessions.signOut()

        assertNull(store.read())
        assertFalse(sessionFile().exists())
    }

    @Test
    fun `forgets the token when the api no longer knows its session`() = runTest {
        val store: TokenStore = tokenStore().apply { write("expired-session") }
        api.enqueue(MockResponse.Builder().code(401).build())

        repository(store).signOut()

        assertNull(store.read())
        assertFalse(sessionFile().exists())
    }

    @Test
    fun `signs out when the keystore refuses to open the stored token`() = runTest {
        val openFailure: GeneralSecurityException = GeneralSecurityException("The keystore lost the key")
        val store: TokenStore = tokenStore(FakeTokenCipher(decryptFailure = openFailure)).apply { write("opaque") }
        api.enqueue(MockResponse.Builder().code(401).build())

        repository(store).signOut()

        assertFalse(sessionFile().exists())
    }

    @Test
    fun `signs out when the keystore provider cannot open the stored token`() = runTest {
        val openFailure: ProviderException = ProviderException("The keystore could not decrypt")
        val store: TokenStore = tokenStore(FakeTokenCipher(decryptFailure = openFailure)).apply { write("opaque") }
        api.enqueue(MockResponse.Builder().code(401).build())

        repository(store).signOut()

        assertFalse(sessionFile().exists())
    }

    @Test
    fun `signs out without waiting on an api that never answers`() = runTest(timeout = 8.seconds) {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().onResponseStart(SocketEffect.Stall).build())

        repository(store).signOut()

        assertFalse(sessionFile().exists())
    }

    @Test
    fun `opens on sign-in after signing out`() = runTest {
        val sessions: SessionRepository = repository(tokenStore().apply { write("opaque-session") })
        api.enqueue(MockResponse.Builder().code(204).build())
        sessions.signOut()

        val result: RestoreResult = sessions.restore()

        assertEquals(RestoreResult.SignedOut, result)
        assertEquals(1, api.requestCount)
    }

    @Test
    fun `sends no bearer on a fief read after signing out`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        val fiefs: FiefRepository = fiefRepository(store)
        api.enqueue(MockResponse.Builder().code(204).build())
        api.enqueue(MockResponse.Builder().code(401).build())
        repository(store).signOut()

        fiefs.read(signedInFief)

        api.takeRequestWithin()
        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `stores the token of the account it creates as a bearer for the next request`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(createdSession(token = "fresh-session", email = "elena@encinar.es"))
        api.enqueue(player(email = "elena@encinar.es"))

        val result: SignUpResult = sessions.signUp("elena@encinar.es", "hierro-y-lana", "Encinar")
        sessions.restore()

        assertEquals(SignUpResult.SignedIn(SignedInPlayer(email = "elena@encinar.es")), result)
        val signUpRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("/api/auth/sign-up/native", signUpRequest.url.encodedPath)
        assertEquals(
            """{"email":"elena@encinar.es","password":"hierro-y-lana","fiefName":"Encinar"}""",
            signUpRequest.body?.utf8(),
        )
        assertEquals("Bearer fresh-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `signs up without a bearer while a token is still stored`() = runTest {
        val store: TokenStore = tokenStore().apply { write("stale-session") }
        api.enqueue(createdSession(token = "fresh-session", email = "elena@encinar.es"))

        repository(store).signUp("elena@encinar.es", "hierro-y-lana", "Encinar")

        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers the sign-up refusal the api names`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.enqueue(json(400, refusalJson("WeakPassword")))
        api.enqueue(json(400, refusalJson("BlankFiefName")))
        api.enqueue(json(409, refusalJson("EmailTaken")))
        api.enqueue(json(400, refusalJson("MalformedEmail")))

        val answers: List<SignUpResult> = List(4) { sessions.signUp("elena@encinar.es", "corta", " ") }

        assertEquals(
            listOf(
                SignUpResult.Refused(SignUpRefusal.WeakPassword),
                SignUpResult.Refused(SignUpRefusal.BlankFiefName),
                SignUpResult.Refused(SignUpRefusal.EmailTaken),
                SignUpResult.Refused(SignUpRefusal.MalformedEmail),
            ),
            answers,
        )
    }

    @Test
    fun `answers an unrecognized sign-up refusal for a malformed request the api answers without a kind`() =
        runTest {
            api.enqueue(MockResponse.Builder().code(400).build())

            val result: SignUpResult = repository(tokenStore()).signUp("elena", "hierro-y-lana", "")

            assertEquals(SignUpResult.Refused(SignUpRefusal.Unrecognized), result)
        }

    @Test
    fun `answers an unrecognized sign-up refusal for a kind the spec does not list`() = runTest {
        api.enqueue(json(400, refusalJson("FiefNameTooLong")))

        val result: SignUpResult = repository(tokenStore()).signUp("elena@encinar.es", "hierro-y-lana", "Encinar")

        assertEquals(SignUpResult.Refused(SignUpRefusal.Unrecognized), result)
    }

    @Test
    fun `answers unreachable when the sign-up cannot reach the api`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.close()

        val result: SignUpResult = sessions.signUp("elena@encinar.es", "hierro-y-lana", "Encinar")

        assertEquals(SignUpResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the api fails while creating the account`() = runTest {
        api.enqueue(MockResponse.Builder().code(503).build())

        val result: SignUpResult = repository(tokenStore()).signUp("elena@encinar.es", "hierro-y-lana", "Encinar")

        assertEquals(SignUpResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the keystore cannot seal the created account's token`() = runTest {
        val sealFailure: ProviderException = ProviderException("The keystore could not encrypt")
        val store: TokenStore = tokenStore(FakeTokenCipher(encryptFailure = sealFailure))
        api.enqueue(createdSession(token = "fresh-session", email = "elena@encinar.es"))

        val result: SignUpResult = repository(store).signUp("elena@encinar.es", "hierro-y-lana", "Encinar")

        assertEquals(SignUpResult.Unreachable, result)
        assertNull(store.read())
    }

    @Test
    fun `posts the email alone to forgot-password`() = runTest {
        api.enqueue(MockResponse.Builder().code(202).build())

        repository(tokenStore()).requestPasswordReset("ines@sotoverde.es")

        val resetRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST", resetRequest.method)
        assertEquals("/api/auth/forgot-password", resetRequest.url.encodedPath)
        assertEquals("""{"email":"ines@sotoverde.es"}""", resetRequest.body?.utf8())
    }

    @Test
    fun `asks for the reset link without a bearer`() = runTest {
        val store: TokenStore = tokenStore().apply { write("stale-session") }
        api.enqueue(MockResponse.Builder().code(202).build())

        repository(store).requestPasswordReset("ines@sotoverde.es")

        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers requested when the api accepts the reset request`() = runTest {
        api.enqueue(MockResponse.Builder().code(202).build())

        val result: PasswordResetRequestResult = repository(tokenStore()).requestPasswordReset("ines@sotoverde.es")

        assertEquals(PasswordResetRequestResult.Requested, result)
    }

    @Test
    fun `answers a malformed email when the api refuses the reset request with 400`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        val result: PasswordResetRequestResult = repository(tokenStore()).requestPasswordReset("ines")

        assertEquals(PasswordResetRequestResult.MalformedEmail, result)
    }

    @Test
    fun `answers unreachable when the api fails the reset request`() = runTest {
        api.enqueue(MockResponse.Builder().code(503).build())

        val result: PasswordResetRequestResult = repository(tokenStore()).requestPasswordReset("ines@sotoverde.es")

        assertEquals(PasswordResetRequestResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the reset request cannot reach the api`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.close()

        val result: PasswordResetRequestResult = sessions.requestPasswordReset("ines@sotoverde.es")

        assertEquals(PasswordResetRequestResult.Unreachable, result)
    }

    @Test
    fun `keeps the session when the reset request answers 401`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        val sessions: SessionRepository = repository(store)
        api.enqueue(MockResponse.Builder().code(401).build())

        sessionEnds.ended.test {
            sessions.requestPasswordReset("ines@sotoverde.es")

            expectNoEvents()
            assertEquals("opaque-session", store.read())
        }
    }

    private fun TestScope.repository(store: TokenStore): SessionRepository =
        SessionRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

    private fun TestScope.fiefRepository(store: TokenStore): FiefRepository =
        FiefRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

    private fun tokenStore(): TokenStore = tokenStore(FakeTokenCipher())

    private fun tokenStore(cipher: FakeTokenCipher): TokenStore = TokenStore(sessionFile(), cipher)

    private fun sessionFile(): File = File(folder.root, "session")

    private fun nativeSession(token: String, email: String): MockResponse =
        json(200, """{"token":"$token","player":${playerJson(email)}}""")

    private fun createdSession(token: String, email: String): MockResponse =
        json(201, """{"token":"$token","player":${playerJson(email)}}""")

    private fun player(email: String): MockResponse = json(200, playerJson(email))

    private fun refusal(kind: String): MockResponse = json(401, refusalJson(kind))

    private fun refusalJson(kind: String): String = """{"kind":"$kind","message":"La petición no vale."}"""

    private fun playerJson(email: String): String =
        """{"id":"0b6f2f2e-6a43-4a8e-9c4e-2f1d3c4b5a69","email":"$email","emailVerified":true,"seenHints":[]}"""

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()
}
