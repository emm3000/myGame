package com.emm.mygame.core.network.account

import app.cash.turbine.test
import com.emm.mygame.core.model.account.PasswordResetRequestResult
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.takeRequestWithin
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PasswordResetRequestRepositoryTest : SessionRepositoryFixture() {

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
}
