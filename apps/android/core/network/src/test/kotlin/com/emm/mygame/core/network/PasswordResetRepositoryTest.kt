package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
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

class PasswordResetRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val mailedToken: PasswordResetToken = PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn")

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `posts the mailed token and the new password to reset-password`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(tokenStore()).resetPassword(mailedToken, "hierro-y-lana")

        val resetRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST", resetRequest.method)
        assertEquals("/api/auth/reset-password", resetRequest.url.encodedPath)
        assertEquals(
            """{"token":"rbi-I29wMEaqgA12gHRHjVk7zceeOXQn","password":"hierro-y-lana"}""",
            resetRequest.body?.utf8(),
        )
    }

    @Test
    fun `resets the password without a bearer while a session is stored`() = runTest {
        val signedIn: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(signedIn).resetPassword(mailedToken, "hierro-y-lana")

        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers changed when the api replaces the password`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        val result: PasswordResetResult = repository(tokenStore()).resetPassword(mailedToken, "hierro-y-lana")

        assertEquals(PasswordResetResult.Changed, result)
    }

    @Test
    fun `drops the stored session when the api replaces the password`() = runTest {
        val signedIn: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(signedIn).resetPassword(mailedToken, "hierro-y-lana")

        assertNull(signedIn.read())
    }

    @Test
    fun `answers a refused link when the api refuses the token`() = runTest {
        api.enqueue(refusal("TokenInvalid"))

        val result: PasswordResetResult = repository(tokenStore()).resetPassword(mailedToken, "hierro-y-lana")

        assertEquals(PasswordResetResult.LinkRefused, result)
    }

    @Test
    fun `keeps the stored session when the api refuses the token`() = runTest {
        val signedIn: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(refusal("TokenInvalid"))

        repository(signedIn).resetPassword(mailedToken, "hierro-y-lana")

        assertEquals("opaque-session", signedIn.read())
    }

    @Test
    fun `answers a weak password when the api refuses the new password`() = runTest {
        api.enqueue(refusal("WeakPassword"))

        val result: PasswordResetResult = repository(tokenStore()).resetPassword(mailedToken, "corta")

        assertEquals(PasswordResetResult.WeakPassword, result)
    }

    @Test
    fun `answers unreachable when the api refuses the reset with an empty body`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        val result: PasswordResetResult = repository(tokenStore()).resetPassword(mailedToken, "hierro-y-lana")

        assertEquals(PasswordResetResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the api fails the reset`() = runTest {
        api.enqueue(MockResponse.Builder().code(503).build())

        val result: PasswordResetResult = repository(tokenStore()).resetPassword(mailedToken, "hierro-y-lana")

        assertEquals(PasswordResetResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the reset cannot reach the api`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.close()

        val result: PasswordResetResult = sessions.resetPassword(mailedToken, "hierro-y-lana")

        assertEquals(PasswordResetResult.Unreachable, result)
    }

    private fun TestScope.repository(store: TokenStore): SessionRepository =
        SessionRepository(
            endpoint = slowMachineEndpoint(api.url("/api/").toString()),
            tokenStore = store,
            languages = PlayerLanguages(store, onNamed = {}),
            sessionEnds = SessionEnds(),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )

    private fun tokenStore(): TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher())

    private fun refusal(kind: String): MockResponse =
        MockResponse.Builder()
            .code(400)
            .addHeader("Content-Type", "application/json")
            .body("""{"kind":"$kind"}""")
            .build()
}
