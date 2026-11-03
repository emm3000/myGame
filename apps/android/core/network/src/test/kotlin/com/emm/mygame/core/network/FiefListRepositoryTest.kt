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

    @Test
    fun `lists every fief in the api's order`() = runTest {
        api.enqueue(json(200, TWO_FIEFS))

        val listed: FiefListResult = repository().listed()

        assertEquals(
            listOf(FiefId(LOWER_PROVINCE_FIEF_ID), FiefId(FOUNDING_FIEF_ID)),
            (listed as FiefListResult.Listed).fiefs.map { fief: ListedFief -> fief.id },
        )
    }

    @Test
    fun `lists a fief with its name, its address and its badges`() = runTest {
        api.enqueue(json(200, BADGED_FIEF))

        assertEquals(
            FiefListResult.Listed(
                listOf(
                    ListedFief(
                        id = FiefId(LOWER_PROVINCE_FIEF_ID),
                        name = "Sotoverde",
                        address = FiefAddress(kingdom = 1, province = 3, plot = 12),
                        freeSlots = listOf(FreeSlot.Build, FreeSlot.Study, FreeSlot.Recruit, FreeSlot.March),
                        fullStores = listOf(ResourceKind.Stone, ResourceKind.Food),
                    ),
                ),
            ),
            repository().listed(),
        )
    }

    @Test
    fun `drops a badge the client does not know`() = runTest {
        api.enqueue(json(200, UNKNOWN_BADGES_FIEF))

        val listed: ListedFief = (repository().listed() as FiefListResult.Listed).fiefs.single()

        assertEquals(listOf(FreeSlot.March), listed.freeSlots)
    }

    @Test
    fun `answers unreachable when the full list cannot be read`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(FiefListResult.Unreachable, repository().listed())
    }

    @Test
    fun `answers unreachable when the full list is not a fief list`() = runTest {
        api.enqueue(json(200, """{"id":"not a list"}"""))

        assertEquals(FiefListResult.Unreachable, repository().listed())
    }

    @Test
    fun `answers unreachable when the full list's api cannot be reached`() = runTest {
        val listings: FiefListRepository = repository()
        api.close()

        assertEquals(FiefListResult.Unreachable, listings.listed())
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
        const val BADGED_FIEF: String =
            """{"fiefs":[{"id":"$LOWER_PROVINCE_FIEF_ID","name":"Sotoverde",""" +
                """"coordinates":{"kingdom":1,"province":3,"plot":12},""" +
                """"freeSlots":["build","study","recruit","march"],"fullStores":["stone","food"]}]}"""
        const val UNKNOWN_BADGES_FIEF: String =
            """{"fiefs":[{"id":"$LOWER_PROVINCE_FIEF_ID","name":"Sotoverde",""" +
                """"coordinates":{"kingdom":1,"province":3,"plot":12},""" +
                """"freeSlots":["forge","march"],"fullStores":["silver"]}]}"""
    }
}
