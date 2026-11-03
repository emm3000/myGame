package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
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
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FiefMarchRepositoryTest {

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
    fun `reads the plot the fief stands on`() = runTest {
        enqueueFief(idleOverview())

        assertEquals(PlotAddress(province = 1, plot = 1), readFief().coordinates)
    }

    @Test
    fun `reads no march while the barracks has none away`() = runTest {
        enqueueFief(idleOverview())

        assertNull(readFief().march)
    }

    @Test
    fun `reads the forage march away with its instants, party and loot`() = runTest {
        enqueueFief(idleOverview().replace(NO_MARCH, FORAGE_ON_THE_ROAD))

        assertEquals(
            AwayMarch(
                order = MarchOrder.Forage,
                target = PlotAddress(province = 1, plot = 7),
                units = listOf(
                    UnitCount(UnitKind.Infantry, 12),
                    UnitCount(UnitKind.Cavalry, 0),
                    UnitCount(UnitKind.Archer, 2),
                    UnitCount(UnitKind.Settler, 0),
                ),
                departedAt = Instant.parse("2026-11-02T15:30:00Z"),
                arrivesAt = Instant.parse("2026-11-02T15:36:00Z"),
                leavesAt = Instant.parse("2026-11-02T16:36:00Z"),
                returnsAt = Instant.parse("2026-11-02T16:42:00Z"),
                recalledAt = null,
                loot = listOf(ResourceQuantity(ResourceKind.Wood, 42), ResourceQuantity(ResourceKind.Food, 42)),
            ),
            readFief().march,
        )
    }

    @Test
    fun `reads the order of a march sent from elsewhere`() = runTest {
        enqueueFief(idleOverview().replace(NO_MARCH, ATTACK_ON_THE_ROAD))

        assertEquals(MarchOrder.Attack, readFief().march?.order)
    }

    @Test
    fun `reads the forage terms of every terrain`() = runTest {
        enqueueFief(idleOverview())

        assertEquals(
            ForageTerms(
                secondsPerProvince = 600,
                secondsPerPlot = 60,
                maxStayHours = 8,
                yieldPerHour = mapOf(
                    Terrain.Lowlands to listOf(
                        ResourceQuantity(ResourceKind.Wood, 3),
                        ResourceQuantity(ResourceKind.Stone, 0),
                        ResourceQuantity(ResourceKind.Iron, 0),
                        ResourceQuantity(ResourceKind.Gold, 0),
                        ResourceQuantity(ResourceKind.Food, 3),
                    ),
                    Terrain.Uplands to listOf(
                        ResourceQuantity(ResourceKind.Wood, 3),
                        ResourceQuantity(ResourceKind.Stone, 3),
                        ResourceQuantity(ResourceKind.Iron, 0),
                        ResourceQuantity(ResourceKind.Gold, 0),
                        ResourceQuantity(ResourceKind.Food, 0),
                    ),
                    Terrain.Ridges to listOf(
                        ResourceQuantity(ResourceKind.Wood, 0),
                        ResourceQuantity(ResourceKind.Stone, 3),
                        ResourceQuantity(ResourceKind.Iron, 3),
                        ResourceQuantity(ResourceKind.Gold, 0),
                        ResourceQuantity(ResourceKind.Food, 0),
                    ),
                ),
            ),
            readFief().forageTerms,
        )
    }

    @Test
    fun `reads the season's road and loot percents`() = runTest {
        enqueueFief(idleOverview().replace("\"road\":100", "\"road\":80"))

        assertEquals(
            SeasonPercents(
                road = 80,
                loot = mapOf(
                    ResourceKind.Wood to 100,
                    ResourceKind.Stone to 100,
                    ResourceKind.Iron to 100,
                    ResourceKind.Gold to 100,
                    ResourceKind.Food to 125,
                ),
            ),
            readFief().season,
        )
    }

    @Test
    fun `reads each unit's carry and road percent`() = runTest {
        enqueueFief(idleOverview())

        assertEquals(
            listOf(48 to 100, 120 to 50, 24 to 100, 0 to 100),
            readFief().units.map { it.carry to it.roadPercent },
        )
    }

    @Test
    fun `posts the forage march naming the plot, the party and the hours`() = runTest {
        api.enqueue(json(200, idleOverview()))

        repository().forage(
            FiefId(LISTED_FIEF_ID),
            target = PlotAddress(province = 3, plot = 7),
            party = listOf(UnitCount(UnitKind.Infantry, 12), UnitCount(UnitKind.Archer, 2)),
            stayHours = 4,
        )

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/marches", request.url.encodedPath)
        assertEquals(
            """{"province":3,"plot":7,"units":{"infantry":12,"cavalry":0,"archer":2,"settler":0},"stayHours":4}""",
            request.body?.utf8(),
        )
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the overview the forage march returns`() = runTest {
        api.enqueue(json(200, idleOverview().replace(NO_MARCH, FORAGE_ON_THE_ROAD)))

        val result: MarchResult = repository().forage(FiefId(LISTED_FIEF_ID), PlotAddress(1, 7), emptyList(), 1)

        assertEquals(MarchOrder.Forage, (result as MarchResult.Answered).fief.march?.order)
    }

    @Test
    fun `posts the recall naming the instant the march departed`() = runTest {
        api.enqueue(json(200, idleOverview()))

        repository().recall(FiefId(LISTED_FIEF_ID), departedAt = Instant.parse("2026-11-02T15:30:00Z"))

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals(
            "/api/fiefs/$LISTED_FIEF_ID/marches/2026-11-02T15:30:00.000Z/recall",
            request.url.encodedPath,
        )
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the march refusal the api names`() = runTest {
        val kinds: List<String> = listOf(
            "NotEnoughUnitsAtHome",
            "MarchSlotBusy",
            "StayOutOfRange",
            "MarchTargetOutOfBounds",
            "PlotHeld",
            "PlotHasCamp",
            "PlotReserved",
            "UnitUnfitForOrder",
            "MarchNotFound",
            "MarchAlreadyReturning",
            "FiefNotFound",
        )
        kinds.forEach { kind: String -> api.enqueue(json(409, """{"kind":"$kind","message":"No."}""")) }
        val fiefs: FiefRepository = repository()

        val refusals: List<MarchResult> = kinds.map {
            fiefs.forage(FiefId(LISTED_FIEF_ID), PlotAddress(1, 7), listOf(UnitCount(UnitKind.Infantry, 1)), 1)
        }

        assertEquals(
            listOf(
                MarchRefusal.NotEnoughUnitsAtHome,
                MarchRefusal.MarchSlotBusy,
                MarchRefusal.StayOutOfRange,
                MarchRefusal.MarchTargetOutOfBounds,
                MarchRefusal.PlotHeld,
                MarchRefusal.PlotHasCamp,
                MarchRefusal.PlotReserved,
                MarchRefusal.UnitUnfitForOrder,
                MarchRefusal.MarchNotFound,
                MarchRefusal.MarchAlreadyReturning,
                MarchRefusal.Unrecognized,
            ).map { MarchResult.Refused(it) },
            refusals,
        )
    }

    @Test
    fun `answers unreachable when the recall cannot reach the api`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        val result: MarchResult = fiefs.recall(FiefId(LISTED_FIEF_ID), Instant.parse("2026-11-02T15:30:00Z"))

        assertTrue(result is MarchResult.Unreachable)
    }

    private fun enqueueFief(overview: String) {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(json(200, overview))
    }

    private suspend fun TestScope.readFief(): FiefSnapshot {
        val result: FiefReadResult = repository().read()
        return (result as FiefReadResult.Read).fief
    }

    private fun TestScope.repository(): FiefRepository {
        val store: TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply {
            write("opaque-session")
        }
        return FiefRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun idleOverview(): String = text("fief-overview-idle.json")

    private fun text(name: String): String =
        requireNotNull(javaClass.classLoader?.getResource(name)) { "missing $name" }.readText()

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val LISTED_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val NO_MARCH: String = """"march":null"""
        const val FORAGE_ON_THE_ROAD: String =
            """"march":{"order":"forage","province":1,"plot":7,"terrain":"lowlands",""" +
                """"units":{"infantry":12,"cavalry":0,"archer":2,"settler":0},"stayHours":1,""" +
                """"departedAt":"2026-11-02T15:30:00.000Z","oneWaySeconds":360,""" +
                """"loot":{"wood":42,"stone":0,"iron":0,"gold":0,"food":42},""" +
                """"arrivesAt":"2026-11-02T15:36:00.000Z","leavesAt":"2026-11-02T16:36:00.000Z",""" +
                """"returnsAt":"2026-11-02T16:42:00.000Z","recalledAt":null,""" +
                """"camp":null,"fought":false}"""
        const val ATTACK_ON_THE_ROAD: String =
            """"march":{"order":"attack","province":1,"plot":4,"terrain":"lowlands",""" +
                """"units":{"infantry":5,"cavalry":0,"archer":0,"settler":0},"stayHours":0,""" +
                """"departedAt":"2026-11-02T15:30:00.000Z","oneWaySeconds":180,""" +
                """"loot":{"wood":30,"stone":0,"iron":0,"gold":30,"food":30},""" +
                """"arrivesAt":"2026-11-02T15:33:00.000Z","leavesAt":"2026-11-02T15:33:00.000Z",""" +
                """"returnsAt":"2026-11-02T15:36:00.000Z","recalledAt":null,""" +
                """"camp":{"tier":2,"strength":3},"fought":false}"""
    }
}
