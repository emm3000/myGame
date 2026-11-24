package com.emm.mygame.core.network.account

import app.cash.turbine.test
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.network.platform.TokenStore
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SessionEndRepositoryTest : SessionRepositoryFixture() {

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
    fun `forgets the language before it reports the end of the session`() = runTest {
        val store: TokenStore = tokenStore()
        val languages: PlayerLanguages = PlayerLanguages(store, onNamed = {})
        val sessions: SessionRepository = repository(store, languages)
        api.enqueue(nativeSession(token = "opaque-session", email = "ines@sotoverde.es"))
        api.enqueue(MockResponse.Builder().code(401).build())
        sessions.signIn("ines@sotoverde.es", "contrasena")

        sessionEnds.ended.map { languages.language.value }.test {
            sessions.restore()

            assertNull(awaitItem())
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
}
