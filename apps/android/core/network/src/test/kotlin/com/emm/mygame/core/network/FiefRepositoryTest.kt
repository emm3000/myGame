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
