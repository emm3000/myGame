package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.network.FakeTokenCipher
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.takeRequestWithin
import java.security.GeneralSecurityException
import java.security.ProviderException
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import mockwebserver3.SocketEffect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class SignOutRepositoryTest : SessionRepositoryFixture() {

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
    fun `sends no bearer on a town read after signing out`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        val towns: TownRepository = townRepository(store)
        api.enqueue(MockResponse.Builder().code(204).build())
        api.enqueue(MockResponse.Builder().code(401).build())
        repository(store).signOut()

        towns.read()

        api.takeRequestWithin()
        assertNull(api.takeRequestWithin().headers["Authorization"])
    }
}
