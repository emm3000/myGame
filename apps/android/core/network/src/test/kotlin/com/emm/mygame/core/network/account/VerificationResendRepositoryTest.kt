package com.emm.mygame.core.network.account

import app.cash.turbine.test
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.VerificationResendResult
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.takeRequestWithin
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class VerificationResendRepositoryTest : SessionRepositoryFixture() {

    @Test
    fun `posts the stored token as a bearer to the verification resend`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        repository(store).resendVerification()

        val resendRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST", resendRequest.method)
        assertEquals("/api/auth/verify-email/resend", resendRequest.url.encodedPath)
        assertEquals("Bearer opaque-session", resendRequest.headers["Authorization"])
    }

    @Test
    fun `answers sent when the api takes the verification resend`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(204).build())

        val result: VerificationResendResult = repository(store).resendVerification()

        assertEquals(VerificationResendResult.Sent, result)
    }

    @Test
    fun `answers mail not sent when the api answers the verification resend with 503`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(json(503, refusalJson("MailNotSent")))

        val result: VerificationResendResult = repository(store).resendVerification()

        assertEquals(VerificationResendResult.MailNotSent, result)
    }

    @Test
    fun `answers unreachable when the api fails the verification resend`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(MockResponse.Builder().code(500).build())

        val result: VerificationResendResult = repository(store).resendVerification()

        assertEquals(VerificationResendResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the verification resend cannot reach the api`() = runTest {
        val sessions: SessionRepository = repository(tokenStore().apply { write("opaque-session") })
        api.close()

        val result: VerificationResendResult = sessions.resendVerification()

        assertEquals(VerificationResendResult.Unreachable, result)
    }

    @Test
    fun `ends the session when the verification resend answers 401`() = runTest {
        val sessions: SessionRepository = repository(tokenStore().apply { write("expired-session") })
        api.enqueue(MockResponse.Builder().code(401).build())

        sessionEnds.ended.test {
            val result: VerificationResendResult = sessions.resendVerification()

            awaitItem()
            assertEquals(VerificationResendResult.Unreachable, result)
        }
    }
}
