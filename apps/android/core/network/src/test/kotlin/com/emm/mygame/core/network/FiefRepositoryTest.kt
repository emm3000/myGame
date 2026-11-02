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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FiefRepositoryTest {

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
    fun `reads the overview of the first fief the api lists`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().read()

        assertEquals("/api/fiefs", api.takeRequest().url.encodedPath)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID", api.takeRequest().url.encodedPath)
    }

    @Test
    fun `sends the stored token as a bearer`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().read()

        val listRequest: RecordedRequest = api.takeRequest()
        assertEquals("Bearer opaque-session", listRequest.headers["Authorization"])
    }

    @Test
    fun `reads the fief name and the instant the api read it`() = runTest {
        enqueueIdleFief()

        val fief: FiefSnapshot = readFief()

        assertEquals("Vadoalto", fief.name)
        assertEquals(Instant.parse("2026-11-02T15:38:39.234Z"), fief.readAt)
    }

    @Test
    fun `reads the five resources in the order the lord reads them`() = runTest {
        enqueueIdleFief()

        val fief: FiefSnapshot = readFief()

        assertEquals(
            listOf(ResourceKind.Wood, ResourceKind.Stone, ResourceKind.Iron, ResourceKind.Gold, ResourceKind.Food),
            fief.resources.map { it.kind },
        )
    }

    @Test
    fun `reads a resource as whole stored units, a rate per hour and a whole capacity`() = runTest {
        enqueueIdleFief()

        val food: StoredResource = readFief().resources.single { it.kind == ResourceKind.Food }

        assertEquals(StoredResource(ResourceKind.Food, amount = 300L, ratePerHour = 18.75, capacity = 1000L), food)
    }

    @Test
    fun `reads an idle build slot`() = runTest {
        enqueueIdleFief()

        assertEquals(BuildSlot.Idle, readFief().slot)
    }

    @Test
    fun `reads a busy build slot with its building, target level and finish`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(resource(200, "fief-overview-busy.json"))

        val slot: BuildSlot = readFief().slot

        assertEquals(
            BuildSlot.Busy(
                building = BuildingKind.Sawmill,
                targetLevel = 1,
                finishesAt = Instant.parse("2026-11-02T15:42:47.138Z"),
            ),
            slot,
        )
    }

    @Test
    fun `maps the seven buildings in the contract's order`() = runTest {
        enqueueIdleFief()

        val buildings: List<BuildingState> = readFief().buildings

        assertEquals(
            listOf(
                BuildingKind.Sawmill,
                BuildingKind.Quarry,
                BuildingKind.IronMine,
                BuildingKind.Farm,
                BuildingKind.Warehouse,
                BuildingKind.Library,
                BuildingKind.Barracks,
            ),
            buildings.map { it.kind },
        )
    }

    @Test
    fun `reads a building with the next level's cost, duration and peasants`() = runTest {
        enqueueIdleFief()

        val buildings: List<BuildingState> = readFief().buildings

        assertEquals(
            BuildingState(
                kind = BuildingKind.IronMine,
                level = 0,
                nextLevel = NextLevel(
                    level = 1,
                    cost = listOf(
                        ResourceCost(ResourceKind.Wood, 90),
                        ResourceCost(ResourceKind.Stone, 70),
                        ResourceCost(ResourceKind.Iron, 20),
                        ResourceCost(ResourceKind.Gold, 0),
                        ResourceCost(ResourceKind.Food, 0),
                    ),
                    duration = 240.seconds,
                    peasants = 1,
                ),
            ),
            buildings[2],
        )
    }

    @Test
    fun `reads a building at its highest level with no next level`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(json(200, idleOverview().replace(WAREHOUSE_AT_LEVEL_0, WAREHOUSE_AT_ITS_TOP)))

        val warehouse: BuildingState = readFief().buildings.single { it.kind == BuildingKind.Warehouse }

        assertEquals(BuildingState(BuildingKind.Warehouse, level = 10, nextLevel = null), warehouse)
    }

    @Test
    fun `reads the peasants free and supplied once the ordered works are done`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(resource(200, "fief-overview-busy.json"))

        assertEquals(Peasants(free = 9, supplied = 10), readFief().peasants)
    }

    @Test
    fun `reads the works waiting in the queue in order with each finish and its cap`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(json(200, busyOverview().replace(EMPTY_QUEUE, TWO_WAITING)))

        assertEquals(
            BuildQueue(
                entries = listOf(
                    WaitingUpgrade(BuildingKind.Sawmill, 2, Instant.parse("2026-11-02T15:50:00.000Z")),
                    WaitingUpgrade(BuildingKind.IronMine, 1, Instant.parse("2026-11-02T16:10:00.000Z")),
                ),
                cap = 4,
            ),
            readFief().queue,
        )
    }

    @Test
    fun `answers unreachable when a waiting work names a building the client does not know`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(json(200, busyOverview().replace(EMPTY_QUEUE, TWO_WAITING.replace("ironMine", "mill"))))

        assertTrue(repository().read() is FiefReadResult.Unreachable)
    }

    @Test
    fun `deletes the upgrade naming its building and level`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().cancel(FiefId(LISTED_FIEF_ID), BuildingKind.IronMine, targetLevel = 2)

        val request: RecordedRequest = api.takeRequest()
        assertEquals("DELETE", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/upgrades/ironMine/2", request.url.encodedPath)
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the overview the cancel returns`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        val result: CancelResult = repository().cancel(FiefId(LISTED_FIEF_ID), BuildingKind.Sawmill, targetLevel = 1)

        assertEquals(BuildSlot.Idle, (result as CancelResult.Cancelled).fief.slot)
    }

    @Test
    fun `answers the cancel of an upgrade the api no longer holds as not found`() = runTest {
        api.enqueue(json(409, """{"kind":"UpgradeNotFound","message":"Esa obra ya no está en curso."}"""))

        assertEquals(
            CancelResult.Refused(CancelRefusal.UpgradeNotFound),
            repository().cancel(FiefId(LISTED_FIEF_ID), BuildingKind.Sawmill, targetLevel = 1),
        )
    }

    @Test
    fun `answers an unrecognized cancel refusal when the api names one the screen does not draw`() = runTest {
        api.enqueue(json(404, """{"kind":"FiefNotFound","message":"No encontramos tus tierras."}"""))

        assertEquals(
            CancelResult.Refused(CancelRefusal.Unrecognized),
            repository().cancel(FiefId(LISTED_FIEF_ID), BuildingKind.Sawmill, targetLevel = 1),
        )
    }

    @Test
    fun `answers unreachable when the cancel cannot reach the api`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        assertEquals(CancelResult.Unreachable, fiefs.cancel(FiefId(LISTED_FIEF_ID), BuildingKind.Farm, targetLevel = 1))
    }

    @Test
    fun `posts the upgrade of the building to the fief it names`() = runTest {
        api.enqueue(resource(200, "fief-overview-busy.json"))

        repository().upgrade(FiefId(LISTED_FIEF_ID), BuildingKind.IronMine)

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/upgrades", request.url.encodedPath)
        assertEquals("""{"building":"ironMine"}""", request.body?.utf8())
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the overview the upgrade returns`() = runTest {
        api.enqueue(resource(200, "fief-overview-busy.json"))

        val result: UpgradeResult = repository().upgrade(FiefId(LISTED_FIEF_ID), BuildingKind.Sawmill)

        assertEquals(
            BuildSlot.Busy(
                building = BuildingKind.Sawmill,
                targetLevel = 1,
                finishesAt = Instant.parse("2026-11-02T15:42:47.138Z"),
            ),
            (result as UpgradeResult.Upgraded).fief.slot,
        )
    }

    @Test
    fun `answers the refusal the api names`() = runTest {
        api.enqueue(json(409, """{"kind":"QueueFull","message":"Ya no caben más obras en espera."}"""))
        api.enqueue(json(409, """{"kind":"InsufficientResources","message":"No tienes recursos suficientes."}"""))
        api.enqueue(json(409, """{"kind":"NotEnoughPeasants","message":"No tienes campesinos libres suficientes."}"""))
        val fiefs: FiefRepository = repository()

        val refusals: List<UpgradeResult> = List(3) { fiefs.upgrade(FiefId(LISTED_FIEF_ID), BuildingKind.Farm) }

        assertEquals(
            listOf(
                UpgradeResult.Refused(UpgradeRefusal.QueueFull),
                UpgradeResult.Refused(UpgradeRefusal.InsufficientResources),
                UpgradeResult.Refused(UpgradeRefusal.NotEnoughPeasants),
            ),
            refusals,
        )
    }

    @Test
    fun `answers an unrecognized refusal when the api names one the screen does not draw`() = runTest {
        api.enqueue(json(404, """{"kind":"FiefNotFound","message":"No encontramos tus tierras."}"""))

        assertEquals(
            UpgradeResult.Refused(UpgradeRefusal.Unrecognized),
            repository().upgrade(FiefId(LISTED_FIEF_ID), BuildingKind.Farm),
        )
    }

    @Test
    fun `answers unreachable when the upgrade cannot reach the api`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        assertEquals(UpgradeResult.Unreachable, fiefs.upgrade(FiefId(LISTED_FIEF_ID), BuildingKind.Farm))
    }

    @Test
    fun `reads the overview when a field the screen never draws holds a value the client does not know`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(json(200, idleOverview().replace(""""terrain":"lowlands"""", """"terrain":"marshes"""")))

        assertEquals("Vadoalto", readFief().name)
    }

    @Test
    fun `reads the overview while an attack on a camp is on the road`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(json(200, idleOverview().replace(""""march":null""", """"march":$ATTACK_ON_THE_ROAD""")))

        assertEquals("Vadoalto", readFief().name)
    }

    @Test
    fun `answers unreachable when the busy slot names a building the client does not know`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        val sawmillSlot: String = """"slot":{"kind":"busy","building":"sawmill""""
        val unknownBuildingSlot: String = """"slot":{"kind":"busy","building":"mill""""
        api.enqueue(json(200, busyOverview().replace(sawmillSlot, unknownBuildingSlot)))

        assertEquals(FiefReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        assertEquals(FiefReadResult.Unreachable, fiefs.read())
    }

    @Test
    fun `answers unreachable when the api refuses the session`() = runTest {
        api.enqueue(MockResponse.Builder().code(401).build())

        assertEquals(FiefReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the fief overview cannot be read`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(FiefReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the lord holds no fief`() = runTest {
        api.enqueue(json(200, """{"fiefs":[]}"""))

        assertEquals(FiefReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the body is not a fief overview`() = runTest {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(json(200, """{"id":"not a fief"}"""))

        assertTrue(repository().read() is FiefReadResult.Unreachable)
    }

    private fun enqueueIdleFief() {
        api.enqueue(resource(200, "fief-list.json"))
        api.enqueue(resource(200, "fief-overview-idle.json"))
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

    private fun busyOverview(): String = text("fief-overview-busy.json")

    private fun text(name: String): String =
        requireNotNull(javaClass.classLoader?.getResource(name)) { "missing $name" }.readText()

    private fun resource(code: Int, name: String): MockResponse = json(code, text(name))

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val LISTED_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val WAREHOUSE_AT_LEVEL_0: String =
            """"warehouse":{"level":0,"nextLevel":{"level":1,"cost":{"wood":150,"stone":100,"iron":20,""" +
                """"gold":0,"food":0},"durationSeconds":180,"peasants":1}}"""
        const val EMPTY_QUEUE: String = """"queue":{"entries":[],"cap":4}"""
        const val TWO_WAITING: String =
            """"queue":{"entries":[""" +
                """{"building":"sawmill","targetLevel":2,"startsAt":"2026-11-02T15:42:47.138Z",""" +
                """"finishesAt":"2026-11-02T15:50:00.000Z"},""" +
                """{"building":"ironMine","targetLevel":1,"startsAt":"2026-11-02T15:50:00.000Z",""" +
                """"finishesAt":"2026-11-02T16:10:00.000Z"}],"cap":4}"""
        const val WAREHOUSE_AT_ITS_TOP: String = """"warehouse":{"level":10,"nextLevel":null}"""
        const val ATTACK_ON_THE_ROAD: String =
            """{"order":"attack","province":1,"plot":4,"terrain":"lowlands",""" +
                """"units":{"infantry":5,"cavalry":0,"archer":0,"settler":0},"stayHours":0,""" +
                """"departedAt":"2026-11-02T15:30:00.000Z","oneWaySeconds":180,""" +
                """"loot":{"wood":30,"stone":0,"iron":0,"gold":30,"food":30},""" +
                """"arrivesAt":"2026-11-02T15:33:00.000Z","leavesAt":"2026-11-02T15:33:00.000Z",""" +
                """"returnsAt":"2026-11-02T15:36:00.000Z","recalledAt":null,""" +
                """"camp":{"tier":2,"strength":3},"fought":false}"""
    }
}
