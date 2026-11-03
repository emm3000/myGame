package com.emm.mygame.core.network

import app.cash.turbine.test
import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import okhttp3.Headers
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ChronicleRepositoryTest {

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
    fun `reads the chronicle of the first fief the api lists`() = runTest {
        enqueueChronicle(EMPTY_CHRONICLE)

        repository().read()

        assertEquals("/api/fiefs", api.takeRequestWithin().url.encodedPath)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/events", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `sends the stored token as a bearer`() = runTest {
        enqueueChronicle(EMPTY_CHRONICLE)

        repository().read()

        val headers: Headers = api.takeRequestWithin().headers
        assertEquals("Bearer opaque-session", headers["Authorization"])
    }

    @Test
    fun `reads every event kind in the order the api answers`() = runTest {
        enqueueChronicle(text("chronicle-every-kind.json"))

        assertEquals(ChronicleReadResult.Read(everyKind), repository().read())
    }

    @Test
    fun `reads an empty chronicle`() = runTest {
        enqueueChronicle(EMPTY_CHRONICLE)

        assertEquals(ChronicleReadResult.Read(emptyList()), repository().read())
    }

    @Test
    fun `skips an event kind it does not know`() = runTest {
        enqueueChronicle(
            """{"events":[{"kind":"tradeSettled","merchant":"Ruy","occurredAt":"2026-11-02T18:20:00.000Z"},""" +
                """$SAWMILL_FINISHED]}""",
        )

        assertEquals(ChronicleReadResult.Read(listOf(sawmillFinished)), repository().read())
    }

    @Test
    fun `skips an event that names a building it does not know`() = runTest {
        enqueueChronicle(
            """{"events":[{"kind":"upgradeFinished","building":"mill","level":1,""" +
                """"occurredAt":"2026-11-02T18:20:00.000Z"},$SAWMILL_FINISHED]}""",
        )

        assertEquals(ChronicleReadResult.Read(listOf(sawmillFinished)), repository().read())
    }

    @Test
    fun `answers unreachable when an event of a kind it knows is malformed`() = runTest {
        enqueueChronicle("""{"events":[{"kind":"upgradeFinished","building":"sawmill"}]}""")

        assertEquals(ChronicleReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the body is not a chronicle`() = runTest {
        enqueueChronicle("""{"id":"not a chronicle"}""")

        assertEquals(ChronicleReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the api refuses the chronicle`() = runTest {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(json(404, """{"kind":"FiefNotFound","message":"No encontramos tus tierras."}"""))

        assertEquals(ChronicleReadResult.Unreachable, repository().read())
    }

    @Test
    fun `ends the session when the chronicle read answers 401`() = runTest {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(MockResponse.Builder().code(401).build())
        val chronicles: ChronicleRepository = repository()

        sessionEnds.ended.test {
            chronicles.read()

            awaitItem()
            assertNull(TokenStore(File(folder.root, "session"), FakeTokenCipher()).read())
        }
    }

    @Test
    fun `answers unreachable when the lord holds no fief`() = runTest {
        api.enqueue(json(200, """{"fiefs":[]}"""))

        assertEquals(ChronicleReadResult.Unreachable, repository().read())
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val chronicles: ChronicleRepository = repository()
        api.close()

        assertEquals(ChronicleReadResult.Unreachable, chronicles.read())
    }

    private fun enqueueChronicle(body: String) {
        api.enqueue(json(200, text("fief-list.json")))
        api.enqueue(json(200, body))
    }

    private fun TestScope.repository(): ChronicleRepository {
        val store: TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply {
            write("opaque-session")
        }
        return ChronicleRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun text(name: String): String =
        requireNotNull(javaClass.classLoader?.getResource(name)) { "missing $name" }.readText()

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private val sawmillFinished: ChronicleEvent = ChronicleEvent.UpgradeFinished(
        building = BuildingKind.Sawmill,
        level = 2,
        occurredAt = Instant.parse("2026-11-02T18:01:00Z"),
    )

    private val secondFief: PlotAddress = PlotAddress(province = 2, plot = 7)

    private val everyKind: List<ChronicleEvent> = listOf(
        ChronicleEvent.TransportArrived(
            plot = secondFief,
            fiefName = "Sotoverde del Páramo",
            cargo = amounts(wood = 120, iron = 30),
            occurredAt = Instant.parse("2026-11-02T18:12:00Z"),
        ),
        ChronicleEvent.TransportSent(
            plot = secondFief,
            fiefName = "Sotoverde del Páramo",
            cargo = amounts(stone = 200, food = 50),
            occurredAt = Instant.parse("2026-11-02T18:11:00Z"),
        ),
        ChronicleEvent.FiefFounded(
            plot = secondFief,
            fiefName = "Sotoverde del Páramo",
            occurredAt = Instant.parse("2026-11-02T18:10:00Z"),
        ),
        ChronicleEvent.FoundingSent(
            plot = secondFief,
            fiefName = "Sotoverde del Páramo",
            occurredAt = Instant.parse("2026-11-02T18:09:00Z"),
        ),
        ChronicleEvent.BattleFought(
            plot = PlotAddress(province = 2, plot = 9),
            campTier = 1,
            isWon = true,
            unitsLost = units(infantry = 2, cavalry = 2),
            campLost = 6,
            occurredAt = Instant.parse("2026-11-02T18:08:00Z"),
        ),
        ChronicleEvent.MarchReturned(
            plot = secondFief,
            units = units(infantry = 12, cavalry = 6),
            loot = amounts(wood = 90, food = 90),
            isRecalled = false,
            occurredAt = Instant.parse("2026-11-02T18:07:00Z"),
        ),
        ChronicleEvent.RecruitsCancelled(
            unit = UnitKind.Infantry,
            delivered = 0,
            cancelled = 12,
            refund = amounts(wood = 240, iron = 120, food = 360),
            occurredAt = Instant.parse("2026-11-02T18:06:00Z"),
        ),
        ChronicleEvent.RecruitsDelivered(
            unit = UnitKind.Cavalry,
            count = 1,
            occurredAt = Instant.parse("2026-11-02T18:05:00Z"),
        ),
        ChronicleEvent.StudyCancelled(
            art = ArtKind.Masonry,
            level = 1,
            refund = amounts(stone = 300, gold = 50),
            occurredAt = Instant.parse("2026-11-02T18:04:00Z"),
        ),
        ChronicleEvent.UpgradeCancelled(
            building = BuildingKind.Farm,
            level = 3,
            refund = amounts(wood = 110, stone = 60),
            occurredAt = Instant.parse("2026-11-02T18:03:00Z"),
        ),
        ChronicleEvent.ArtLearned(
            art = ArtKind.Smithing,
            level = 2,
            occurredAt = Instant.parse("2026-11-02T18:02:00Z"),
        ),
        sawmillFinished,
    )

    private fun amounts(
        wood: Long = 0,
        stone: Long = 0,
        iron: Long = 0,
        gold: Long = 0,
        food: Long = 0,
    ): List<ResourceQuantity> = listOf(
        ResourceQuantity(ResourceKind.Wood, wood),
        ResourceQuantity(ResourceKind.Stone, stone),
        ResourceQuantity(ResourceKind.Iron, iron),
        ResourceQuantity(ResourceKind.Gold, gold),
        ResourceQuantity(ResourceKind.Food, food),
    )

    private fun units(infantry: Int = 0, cavalry: Int = 0, archer: Int = 0, settler: Int = 0): List<UnitCount> =
        listOf(
            UnitCount(UnitKind.Infantry, infantry),
            UnitCount(UnitKind.Cavalry, cavalry),
            UnitCount(UnitKind.Archer, archer),
            UnitCount(UnitKind.Settler, settler),
        )

    private companion object {
        const val LISTED_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val EMPTY_CHRONICLE: String = """{"events":[]}"""
        const val SAWMILL_FINISHED: String =
            """{"kind":"upgradeFinished","building":"sawmill","level":2,"occurredAt":"2026-11-02T18:01:00.000Z"}"""
    }
}
