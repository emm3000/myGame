package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.network.platform.TokenStore
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SessionRestoreRepositoryTest : SessionRepositoryFixture() {

    @Test
    fun `restores the player the stored token's session names`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(player(email = "ines@sotoverde.es"))

        val result: RestoreResult = repository(store).restore()

        assertEquals(
            RestoreResult.SignedIn(
                SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
            result,
        )
    }

    @Test
    fun `restores a player whose email the api has not verified`() = runTest {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        api.enqueue(json(200, playerJson(email = "ines@sotoverde.es", isEmailVerified = false)))

        val result: RestoreResult = repository(store).restore()

        assertEquals(
            RestoreResult.SignedIn(
                SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = false, scaffold = PlayerScaffold.Spanish),
            ),
            result,
        )
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
    fun `asks the api nothing on restore once a read has ended the session`() = runTest {
        val store: TokenStore = tokenStore().apply { write("expired-session") }
        api.enqueue(MockResponse.Builder().code(401).build())
        townRepository(store).read()

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
}
