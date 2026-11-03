package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import kotlin.time.Duration.Companion.seconds
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

class FiefArmyRepositoryTest {

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
    fun `reads each unit kind with its count, terms and barracks level in the contract's order`() = runTest {
        enqueueFief(idleOverview().replace(NO_UNITS, TWELVE_INFANTRY))

        assertEquals(
            UnitState(
                kind = UnitKind.Infantry,
                count = 12,
                away = 0,
                barracksLevel = 1,
                carry = 48,
                roadPercent = 100,
                terms = RecruitTerms(
                    cost = listOf(
                        ResourceCost(ResourceKind.Wood, 20),
                        ResourceCost(ResourceKind.Stone, 0),
                        ResourceCost(ResourceKind.Iron, 10),
                        ResourceCost(ResourceKind.Gold, 0),
                        ResourceCost(ResourceKind.Food, 30),
                    ),
                    peasants = 1,
                    perUnit = 68.seconds,
                ),
            ),
            readFief().units.first(),
        )
    }

    @Test
    fun `maps the unit kinds in the contract's order`() = runTest {
        enqueueFief(idleOverview())

        assertEquals(
            listOf(UnitKind.Infantry, UnitKind.Cavalry, UnitKind.Archer, UnitKind.Settler),
            readFief().units.map { it.kind },
        )
    }

    @Test
    fun `counts the units the march took away`() = runTest {
        enqueueFief(idleOverview().replace(NO_UNITS, TWELVE_INFANTRY).replace(NO_MARCH, ATTACK_ON_THE_ROAD))

        assertEquals(5, readFief().units.first().away)
    }

    @Test
    fun `reads the lowest free peasants a levy is checked against`() = runTest {
        enqueueFief(idleOverview().replace("\"lowestFree\":10", "\"lowestFree\":4"))

        assertEquals(4, readFief().peasants.lowestFree)
    }

    @Test
    fun `reads no recruit order while the barracks is idle`() = runTest {
        enqueueFief(idleOverview())

        assertNull(readFief().recruitOrder)
    }

    @Test
    fun `reads the levy under way`() = runTest {
        enqueueFief(idleOverview().replace(NO_RECRUIT_ORDER, LEVY_OF_TWELVE))

        assertEquals(
            RecruitOrder(
                unit = UnitKind.Infantry,
                count = 12,
                delivered = 4,
                perUnit = 60.seconds,
                startedAt = Instant.parse("2026-11-02T15:30:00.000Z"),
                endsAt = Instant.parse("2026-11-02T15:42:00.000Z"),
            ),
            readFief().recruitOrder,
        )
    }

    @Test
    fun `posts the recruit order naming the unit and the count`() = runTest {
        api.enqueue(json(200, idleOverview()))

        repository().recruit(FiefId(LISTED_FIEF_ID), UnitKind.Archer, count = 7)

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/recruit-orders", request.url.encodedPath)
        assertEquals("""{"unit":"archer","count":7}""", request.body?.utf8())
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the overview the recruit order returns`() = runTest {
        api.enqueue(json(200, idleOverview().replace(NO_RECRUIT_ORDER, LEVY_OF_TWELVE)))

        val result: RecruitResult = repository().recruit(FiefId(LISTED_FIEF_ID), UnitKind.Infantry, count = 12)

        assertEquals(12, (result as RecruitResult.Answered).fief.recruitOrder?.count)
    }

    @Test
    fun `deletes the levy naming its unit and the instant it started`() = runTest {
        api.enqueue(json(200, idleOverview()))

        repository().cancelRecruit(
            FiefId(LISTED_FIEF_ID),
            UnitKind.Infantry,
            startedAt = Instant.parse("2026-11-02T15:30:00Z"),
        )

        val request: RecordedRequest = api.takeRequest()
        assertEquals("DELETE", request.method)
        assertEquals(
            "/api/fiefs/$LISTED_FIEF_ID/recruit-orders/infantry/2026-11-02T15:30:00.000Z",
            request.url.encodedPath,
        )
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the recruit refusal the api names`() = runTest {
        val kinds: List<String> = listOf(
            "BarracksNotBuilt",
            "BarracksTooLow",
            "RecruitSlotBusy",
            "RecruitOrderNotFound",
            "InsufficientResources",
            "NotEnoughPeasants",
            "FiefNotFound",
        )
        kinds.forEach { kind: String -> api.enqueue(json(409, """{"kind":"$kind","message":"No."}""")) }
        val fiefs: FiefRepository = repository()

        val refusals: List<RecruitResult> = kinds.map { fiefs.recruit(FiefId(LISTED_FIEF_ID), UnitKind.Infantry, 1) }

        assertEquals(
            listOf(
                RecruitRefusal.BarracksNotBuilt,
                RecruitRefusal.BarracksTooLow,
                RecruitRefusal.RecruitSlotBusy,
                RecruitRefusal.RecruitOrderNotFound,
                RecruitRefusal.InsufficientResources,
                RecruitRefusal.NotEnoughPeasants,
                RecruitRefusal.Unrecognized,
            ).map { RecruitResult.Refused(it) },
            refusals,
        )
    }

    @Test
    fun `answers unreachable when the levy cannot reach the api`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        assertTrue(fiefs.recruit(FiefId(LISTED_FIEF_ID), UnitKind.Infantry, 1) is RecruitResult.Unreachable)
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
        const val NO_UNITS: String = """"units":{"infantry":0,"""
        const val TWELVE_INFANTRY: String = """"units":{"infantry":12,"""
        const val NO_RECRUIT_ORDER: String = """"recruitOrder":null"""
        const val LEVY_OF_TWELVE: String =
            """"recruitOrder":{"unit":"infantry","count":12,"delivered":4,"perUnitSeconds":60,""" +
                """"startedAt":"2026-11-02T15:30:00.000Z","endsAt":"2026-11-02T15:42:00.000Z"}"""
        const val NO_MARCH: String = """"march":null"""
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
