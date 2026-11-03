package com.emm.mygame.core.network

import app.cash.turbine.test
import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FiefListRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

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
    fun `lists the fiefs of the signed-in lord`() = runTest {
        api.enqueue(json(200, TWO_FIEFS))

        repository().firstListed()

        assertEquals("/api/fiefs", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `sends the stored token as a bearer`() = runTest {
        api.enqueue(json(200, TWO_FIEFS))

        repository().firstListed()

        assertEquals("Bearer opaque-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers the first fief the api lists`() = runTest {
        api.enqueue(json(200, TWO_FIEFS))

        assertEquals(FirstFiefResult.Listed(FiefId(LOWER_PROVINCE_FIEF_ID)), repository().firstListed())
    }

    @Test
    fun `answers no fief when the api lists none`() = runTest {
        api.enqueue(json(200, """{"fiefs":[]}"""))

        assertEquals(FirstFiefResult.NoFief, repository().firstListed())
    }

    @Test
    fun `answers unreachable when the api refuses the list`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(FirstFiefResult.Unreachable, repository().firstListed())
    }

    @Test
    fun `answers unreachable when the body is not a fief list`() = runTest {
        api.enqueue(json(200, """{"id":"not a list"}"""))

        assertEquals(FirstFiefResult.Unreachable, repository().firstListed())
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val listings: FiefListRepository = repository()
        api.close()

        assertEquals(FirstFiefResult.Unreachable, listings.firstListed())
    }

    @Test
    fun `ends the session when the list answers 401`() = runTest {
        api.enqueue(MockResponse.Builder().code(401).build())
        val listings: FiefListRepository = repository()

        sessionEnds.ended.test {
            listings.firstListed()

            awaitItem()
            assertNull(TokenStore(File(folder.root, "session"), FakeTokenCipher()).read())
        }
    }

    private fun TestScope.repository(): FiefListRepository {
        val store: TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply {
            write("opaque-session")
        }
        return FiefListRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val LOWER_PROVINCE_FIEF_ID: String = "7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17"
        const val FOUNDING_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val TWO_FIEFS: String =
            """{"fiefs":[""" +
                """{"id":"$LOWER_PROVINCE_FIEF_ID","name":"Sotoverde",""" +
                """"coordinates":{"kingdom":1,"province":1,"plot":4},"freeSlots":["build"],"fullStores":[]},""" +
                """{"id":"$FOUNDING_FIEF_ID","name":"Vadoalto",""" +
                """"coordinates":{"kingdom":1,"province":3,"plot":1},"freeSlots":["build"],"fullStores":[]}]}"""
    }
}
