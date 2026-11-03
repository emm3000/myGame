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

class MapRepositoryTest {

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
    fun `reads the own province of the fief the route names`() = runTest {
        enqueueMap(EMPTY_PROVINCE)

        repository().readOwn(FiefId(OTHER_FIEF_ID))

        api.takeRequestWithin()
        assertEquals("/api/fiefs/$OTHER_FIEF_ID/map", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `reads the province the player names from the fief the route names`() = runTest {
        enqueueMap(EMPTY_PROVINCE)

        repository().read(FiefId(OTHER_FIEF_ID), province = 4)

        api.takeRequestWithin()
        assertEquals("/api/fiefs/$OTHER_FIEF_ID/map/4", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `sends the stored token as a bearer`() = runTest {
        enqueueMap(EMPTY_PROVINCE)

        repository().readOwn(FiefId(LISTED_FIEF_ID))

        assertEquals("Bearer opaque-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `reads every kind of plot in the order the api answers`() = runTest {
        enqueueMap(
            """{"kingdom":1,"province":3,"lastProvince":9,"terrain":"uplands","plots":[""" +
                """{"plot":1,"fief":null,"camp":null,"reservation":null},""" +
                """{"plot":2,"fief":{"name":"Sotoverde","isOwn":false},"camp":null,"reservation":null},""" +
                """{"plot":3,"fief":{"name":"Páramo","isOwn":true},"camp":null,"reservation":null},""" +
                """{"plot":4,"fief":null,"camp":{"tier":2,"strength":15},"reservation":null},""" +
                """{"plot":5,"fief":null,"camp":null,"reservation":{"isOwn":false}},""" +
                """{"plot":6,"fief":null,"camp":null,"reservation":{"isOwn":true}}]}""",
        )

        assertEquals(
            MapReadResult.Read(
                ProvinceMap(
                    kingdom = 1,
                    province = 3,
                    lastProvince = 9,
                    terrain = Terrain.Uplands,
                    plots = listOf(
                        MapPlot(plot = 1, holder = PlotHolder.Free),
                        MapPlot(plot = 2, holder = PlotHolder.Held(name = "Sotoverde")),
                        MapPlot(plot = 3, holder = PlotHolder.Own(name = "Páramo", fief = null)),
                        MapPlot(plot = 4, holder = PlotHolder.Camp(tier = 2, strength = 15)),
                        MapPlot(plot = 5, holder = PlotHolder.Reserved(isOwn = false)),
                        MapPlot(plot = 6, holder = PlotHolder.Reserved(isOwn = true)),
                    ),
                ),
            ),
            repository().readOwn(FiefId(LISTED_FIEF_ID)),
        )
    }

    @Test
    fun `names the lord's fief on an own plot by the id the fief list gives it`() = runTest {
        api.enqueue(
            json(
                200,
                """{"fiefs":[""" +
                    """{"id":"$LISTED_FIEF_ID","name":"Sotoverde",""" +
                    """"coordinates":{"kingdom":1,"province":1,"plot":1},""" +
                    """"freeSlots":[],"fullStores":[]},""" +
                    """{"id":"$OTHER_FIEF_ID","name":"Vega","coordinates":{"kingdom":1,"province":1,"plot":4},""" +
                    """"freeSlots":[],"fullStores":[]}]}""",
            ),
        )
        api.enqueue(
            json(
                200,
                """{"kingdom":1,"province":1,"lastProvince":9,"terrain":"lowlands","plots":[""" +
                    """{"plot":1,"fief":{"name":"Sotoverde","isOwn":true},"camp":null,"reservation":null},""" +
                    """{"plot":4,"fief":{"name":"Vega","isOwn":true},"camp":null,"reservation":null}]}""",
            ),
        )

        val answer: MapReadResult = repository().readOwn(FiefId(LISTED_FIEF_ID))

        assertEquals(
            listOf(
                PlotHolder.Own(name = "Sotoverde", fief = FiefId(LISTED_FIEF_ID)),
                PlotHolder.Own(name = "Vega", fief = FiefId(OTHER_FIEF_ID)),
            ),
            (answer as MapReadResult.Read).map.plots.map { it.holder },
        )
    }

    @Test
    fun `reads a plot with a fief and a camp as the fief`() = runTest {
        enqueueMap(
            """{"kingdom":1,"province":1,"lastProvince":9,"terrain":"lowlands","plots":[""" +
                """{"plot":4,"fief":{"name":"Sotoverde","isOwn":false},"camp":{"tier":2,"strength":15},""" +
                """"reservation":null}]}""",
        )

        val answer: MapReadResult = repository().readOwn(FiefId(LISTED_FIEF_ID))

        assertEquals(PlotHolder.Held(name = "Sotoverde"), (answer as MapReadResult.Read).map.plots.single().holder)
    }

    @Test
    fun `answers a province past the last one as not found`() = runTest {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(json(404, """{"kind":"ProvinceNotFound","message":"Esa provincia no está en el mapa."}"""))

        assertEquals(MapReadResult.ProvinceNotFound, repository().read(FiefId(LISTED_FIEF_ID), province = 99))
    }

    @Test
    fun `answers unreachable when the api refuses the fief`() = runTest {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(json(404, """{"kind":"FiefNotFound","message":"No encontramos tus tierras."}"""))

        assertEquals(MapReadResult.Unreachable, repository().readOwn(FiefId(LISTED_FIEF_ID)))
    }

    @Test
    fun `ends the session when the map read answers 401`() = runTest {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(MockResponse.Builder().code(401).build())
        val maps: MapRepository = repository()

        sessionEnds.ended.test {
            maps.readOwn(FiefId(LISTED_FIEF_ID))

            awaitItem()
            assertNull(TokenStore(File(folder.root, "session"), FakeTokenCipher()).read())
        }
    }

    @Test
    fun `answers unreachable for a terrain it does not know`() = runTest {
        enqueueMap(EMPTY_PROVINCE.replace("lowlands", "marshes"))

        assertEquals(MapReadResult.Unreachable, repository().readOwn(FiefId(LISTED_FIEF_ID)))
    }

    @Test
    fun `answers unreachable when the body is not a province`() = runTest {
        enqueueMap("""{"id":"not a province"}""")

        assertEquals(MapReadResult.Unreachable, repository().readOwn(FiefId(LISTED_FIEF_ID)))
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val maps: MapRepository = repository()
        api.close()

        assertEquals(MapReadResult.Unreachable, maps.readOwn(FiefId(LISTED_FIEF_ID)))
    }

    private fun enqueueMap(body: String) {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(json(200, body))
    }

    private fun TestScope.repository(): MapRepository {
        val store: TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply {
            write("opaque-session")
        }
        return MapRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun text(name: String): String =
        checkNotNull(javaClass.classLoader?.getResource(name)).readText()

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val LISTED_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val OTHER_FIEF_ID: String = "7c1e2f4a-0b3d-4e5f-9a8b-1c2d3e4f5a6b"
        const val EMPTY_PROVINCE: String =
            """{"kingdom":1,"province":1,"lastProvince":9,"terrain":"lowlands","plots":[]}"""
    }
}
