package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class RegionMapRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `reads the area of the player's own town when no area is named`() = runTest {
        api.enqueue(json(200, MAP))

        town().readMap(area = null)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("GET /api/town/map", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `reads the area it names`() = runTest {
        api.enqueue(json(200, MAP))

        town().readMap(area = 12)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("GET /api/town/map/12", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `reads the terrain and each site free or holding a town`() = runTest {
        api.enqueue(json(200, MAP))

        assertEquals(
            RegionMapResult.Read(
                RegionMap(
                    region = 1,
                    area = 2,
                    lastArea = 40,
                    terrain = Terrain.River,
                    sites = listOf(
                        RegionMap.Site(site = 1, town = null),
                        RegionMap.Site(site = 2, town = RegionMap.SiteTown(name = "Riverton", isOwn = true)),
                        RegionMap.Site(site = 3, town = RegionMap.SiteTown(name = "Oakdale", isOwn = false)),
                    ),
                ),
            ),
            town().readMap(area = 2),
        )
    }

    @Test
    fun `reads each terrain from its own key`() = runTest {
        val terrains: Map<String, Terrain> = mapOf(
            "fields" to Terrain.Fields,
            "river" to Terrain.River,
            "hills" to Terrain.Hills,
        )
        val towns: TownRepository = town()

        terrains.forEach { (wire: String, terrain: Terrain) ->
            api.enqueue(json(200, MAP.replace(""""terrain":"river"""", """"terrain":"$wire"""")))

            assertEquals(terrain, (towns.readMap(area = null) as RegionMapResult.Read).map.terrain)
        }
    }

    @Test
    fun `answers unreachable for a terrain the client does not know`() = runTest {
        api.enqueue(json(200, MAP.replace(""""terrain":"river"""", """"terrain":"desert"""")))

        assertEquals(RegionMapResult.Unreachable, town().readMap(area = null))
    }

    @Test
    fun `answers area not found for an area past the last browsable`() = runTest {
        api.enqueue(json(404, """{"kind":"AreaNotFound"}"""))

        assertEquals(RegionMapResult.AreaNotFound, town().readMap(area = 41))
    }

    @Test
    fun `answers no town when the player holds none`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(RegionMapResult.NoTown, town().readMap(area = null))
    }

    @Test
    fun `answers unreachable for a malformed path`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(RegionMapResult.Unreachable, town().readMap(area = 0))
    }

    @Test
    fun `answers unreachable for another refusal`() = runTest {
        api.enqueue(json(409, """{"kind":"SiteHeld"}"""))

        assertEquals(RegionMapResult.Unreachable, town().readMap(area = null))
    }

    @Test
    fun `answers unreachable when the map cannot reach the api`() = runTest {
        api.close()

        assertEquals(RegionMapResult.Unreachable, town().readMap(area = null))
    }

    @Test
    fun `keeps the held town through a map read`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))
        towns.read()

        towns.readMap(area = null)

        assertNotNull(towns.town.value)
    }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") },
        sessionEnds = SessionEnds(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")),
    )

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val MAP: String =
            """{"region":1,"area":2,"lastArea":40,"terrain":"river","sites":[""" +
                """{"site":1,"town":null},""" +
                """{"site":2,"town":{"name":"Riverton","isOwn":true}},""" +
                """{"site":3,"town":{"name":"Oakdale","isOwn":false}}]}"""
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val TERMS: String =
            """{"cost":{"money":40,"food":0,"power":0,"material":0},"secondsPerHire":60,""" +
                """"people":1,"requiredOfficeLevel":1}"""
        const val TOWN: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":2,"site":2},"terrain":"river",""" +
                """"season":null,"stocks":{"money":$STOCK,"food":$STOCK,"power":$STOCK,"material":$STOCK},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":$FLAT,"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":$FLAT},""" +
                """"work":{"slot":null,"waitingList":[],"cap":2},""" +
                """"hiring":{"order":null,"hires":{"worker":0,"truck":0},""" +
                """"terms":{"worker":$TERMS,"truck":$TERMS}},"job":null,""" +
                """"lessons":[],"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"nextStep":{"kind":"caughtUp"},"nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""
    }
}
