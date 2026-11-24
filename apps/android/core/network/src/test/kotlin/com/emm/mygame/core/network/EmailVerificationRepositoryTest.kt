package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import kotlinx.coroutines.test.TestScope
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

class EmailVerificationRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val mailedToken: EmailVerificationToken = EmailVerificationToken("iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y")

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `posts the mailed token to verify-email`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(tokenStore()).verifyEmail(mailedToken)

        val verifyRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST", verifyRequest.method)
        assertEquals("/api/auth/verify-email", verifyRequest.url.encodedPath)
        assertEquals("""{"token":"iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y"}""", verifyRequest.body?.utf8())
    }

    @Test
    fun `verifies the email without a bearer while a session is stored`() = runTest {
        val signedIn: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(signedIn).verifyEmail(mailedToken)

        assertNull(api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers verified when the api confirms the email`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        val result: EmailVerificationResult = repository(tokenStore()).verifyEmail(mailedToken)

        assertEquals(EmailVerificationResult.Verified, result)
    }

    @Test
    fun `answers a refused link when the api refuses the token`() = runTest {
        api.enqueue(refusal("TokenInvalid"))

        val result: EmailVerificationResult = repository(tokenStore()).verifyEmail(mailedToken)

        assertEquals(EmailVerificationResult.LinkRefused, result)
    }

    @Test
    fun `keeps the stored session when the api refuses the token`() = runTest {
        val signedIn: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(refusal("TokenInvalid"))

        repository(signedIn).verifyEmail(mailedToken)

        assertEquals("opaque-session", signedIn.read())
    }

    @Test
    fun `answers unreachable when the api refuses the verification with an empty body`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        val result: EmailVerificationResult = repository(tokenStore()).verifyEmail(mailedToken)

        assertEquals(EmailVerificationResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the api fails the verification`() = runTest {
        api.enqueue(MockResponse.Builder().code(503).build())

        val result: EmailVerificationResult = repository(tokenStore()).verifyEmail(mailedToken)

        assertEquals(EmailVerificationResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the verification cannot reach the api`() = runTest {
        val sessions: SessionRepository = repository(tokenStore())
        api.close()

        val result: EmailVerificationResult = sessions.verifyEmail(mailedToken)

        assertEquals(EmailVerificationResult.Unreachable, result)
    }

    private fun TestScope.repository(store: TokenStore): SessionRepository =
        apiRepositories(
            endpoint = slowMachineEndpoint(api.url("/api/").toString()),
            tokenStore = store,
        ).sessions

    private fun tokenStore(): TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher())

    private fun refusal(kind: String): MockResponse =
        MockResponse.Builder()
            .code(400)
            .addHeader("Content-Type", "application/json")
            .body("""{"kind":"$kind"}""")
            .build()
}
