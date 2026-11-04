package com.emm.mygame.core.network

import app.cash.turbine.test
import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
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

class FiefRepositoryTest {

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
    fun `reads the overview of the fief the route names`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().read(FiefId(SECOND_FIEF_ID))

        assertEquals("/api/fiefs/$SECOND_FIEF_ID", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `sends the stored token as a bearer`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().read(FiefId(LISTED_FIEF_ID))

        val overviewRequest: RecordedRequest = api.takeRequestWithin()
        assertEquals("Bearer opaque-session", overviewRequest.headers["Authorization"])
    }

    @Test
    fun `reads the fief name and the instant the api read it`() = runTest {
        enqueueIdleFief()

        val fief: FiefSnapshot = readFief()

        assertEquals("Vadoalto", fief.name)
        assertEquals(Instant.parse("2026-11-02T15:38:39.234Z"), fief.readAt)
    }

    @Test
    fun `reads the instant the season ends`() = runTest {
        enqueueIdleFief()

        assertEquals(Instant.parse("2026-11-09T00:00:00.000Z"), readFief().seasonEndsAt)
    }

    @Test
    fun `reads no season end when the overview carries no season`() = runTest {
        api.enqueue(json(200, idleOverview().replace(SPRING_SEASON, """"season":null""")))

        assertNull(readFief().seasonEndsAt)
    }

    @Test
    fun `reads the season in force and its year`() = runTest {
        enqueueIdleFief()

        assertEquals(SeasonInForce(kind = SeasonKind.Spring, year = 2), readFief().seasonInForce)
    }

    @Test
    fun `reads no season in force when the overview carries no season`() = runTest {
        api.enqueue(json(200, idleOverview().replace(SPRING_SEASON, """"season":null""")))

        assertNull(readFief().seasonInForce)
    }

    @Test
    fun `answers unreachable when the season is one the client does not know`() = runTest {
        api.enqueue(json(200, idleOverview().replace(""""kind":"spring"""", """"kind":"monsoon"""")))

        assertEquals(FiefReadResult.Unreachable, repository().read(FiefId(LISTED_FIEF_ID)))
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
        api.enqueue(json(200, idleOverview().replace(WAREHOUSE_AT_LEVEL_0, WAREHOUSE_AT_ITS_TOP)))

        val warehouse: BuildingState = readFief().buildings.single { it.kind == BuildingKind.Warehouse }

        assertEquals(BuildingState(BuildingKind.Warehouse, level = 10, nextLevel = null), warehouse)
    }

    @Test
    fun `reads the peasants free and supplied once the ordered works are done`() = runTest {
        api.enqueue(resource(200, "fief-overview-busy.json"))

        assertEquals(Peasants(free = 9, supplied = 10, lowestFree = 9), readFief().peasants)
    }

    @Test
    fun `reads the works waiting in the queue in order with each finish and its cap`() = runTest {
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
        api.enqueue(json(200, busyOverview().replace(EMPTY_QUEUE, TWO_WAITING.replace("ironMine", "mill"))))

        assertTrue(repository().read(FiefId(LISTED_FIEF_ID)) is FiefReadResult.Unreachable)
    }

    @Test
    fun `deletes the upgrade naming its building and level`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().cancel(FiefId(LISTED_FIEF_ID), BuildingKind.IronMine, targetLevel = 2)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("DELETE", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/upgrades/ironMine/2", request.url.encodedPath)
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `cancels the barracks as any other building`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().cancel(FiefId(LISTED_FIEF_ID), BuildingKind.Barracks, targetLevel = 1)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("DELETE", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/upgrades/barracks/1", request.url.encodedPath)
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

        val request: RecordedRequest = api.takeRequestWithin()
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
        api.enqueue(json(200, idleOverview().replace(""""terrain":"lowlands"""", """"terrain":"marshes"""")))

        assertEquals("Vadoalto", readFief().name)
    }

    @Test
    fun `reads the overview while an attack on a camp is on the road`() = runTest {
        api.enqueue(json(200, idleOverview().replace(""""march":null""", """"march":$ATTACK_ON_THE_ROAD""")))

        assertEquals("Vadoalto", readFief().name)
    }

    @Test
    fun `answers unreachable when the busy slot names a building the client does not know`() = runTest {
        val sawmillSlot: String = """"slot":{"kind":"busy","building":"sawmill""""
        val unknownBuildingSlot: String = """"slot":{"kind":"busy","building":"mill""""
        api.enqueue(json(200, busyOverview().replace(sawmillSlot, unknownBuildingSlot)))

        assertEquals(FiefReadResult.Unreachable, repository().read(FiefId(LISTED_FIEF_ID)))
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        assertEquals(FiefReadResult.Unreachable, fiefs.read(FiefId(LISTED_FIEF_ID)))
    }

    @Test
    fun `ends the session when a signed-in read answers 401`() = runTest {
        api.enqueue(signedOut())
        val fiefs: FiefRepository = repository()

        sessionEnds.ended.test {
            fiefs.read(FiefId(LISTED_FIEF_ID))

            awaitItem()
            assertNull(tokenStore().read())
        }
    }

    @Test
    fun `ends the session when any fief mutation answers 401`() = runTest {
        val fiefs: FiefRepository = repository()
        val fief: FiefId = FiefId(LISTED_FIEF_ID)
        val mutations: List<suspend () -> Unit> = listOf(
            { fiefs.upgrade(fief, BuildingKind.Sawmill) },
            { fiefs.cancel(fief, BuildingKind.Sawmill, targetLevel = 2) },
            { fiefs.startStudy(fief, ArtKind.Smithing) },
            { fiefs.cancelStudy(fief, ArtKind.Smithing, targetLevel = 1) },
            { fiefs.recruit(fief, UnitKind.Infantry, count = 4) },
            { fiefs.cancelRecruit(fief, UnitKind.Infantry, startedAt = Instant.parse("2026-11-02T15:30:00Z")) },
            { fiefs.dispatch(fief, MarchDispatch.Found(PlotAddress(province = 2, plot = 7), name = "Vega")) },
            { fiefs.recall(fief, departedAt = Instant.parse("2026-11-02T15:30:00Z")) },
        )

        sessionEnds.ended.test {
            mutations.forEach { mutation: suspend () -> Unit ->
                tokenStore().write("opaque-session")
                api.enqueue(signedOut())

                mutation()

                awaitItem()
                assertNull(tokenStore().read())
            }
        }
    }

    @Test
    fun `reports one end for several 401s in flight at once`() = runTest {
        repeat(3) { api.enqueue(signedOut()) }
        val fiefs: FiefRepository = repository()

        sessionEnds.ended.test {
            List(3) { async { fiefs.read(FiefId(LISTED_FIEF_ID)) } }.awaitAll()

            awaitItem()
            expectNoEvents()
        }
    }

    @Test
    fun `reports no end for a 401 to a request sent without a bearer`() = runTest {
        val fiefs: FiefRepository = repository()
        tokenStore().clear()
        api.enqueue(signedOut())

        sessionEnds.ended.test {
            fiefs.read(FiefId(LISTED_FIEF_ID))

            expectNoEvents()
        }
    }

    @Test
    fun `answers unreachable when the fief overview cannot be read`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(FiefReadResult.Unreachable, repository().read(FiefId(LISTED_FIEF_ID)))
    }

    @Test
    fun `answers unreachable when the body is not a fief overview`() = runTest {
        api.enqueue(json(200, """{"id":"not a fief"}"""))

        assertTrue(repository().read(FiefId(LISTED_FIEF_ID)) is FiefReadResult.Unreachable)
    }

    @Test
    fun `reads an idle study slot`() = runTest {
        enqueueIdleFief()

        assertEquals(StudySlot.Idle, readFief().study)
    }

    @Test
    fun `reads a busy study slot with its art, target level, finish and the cost it debited`() = runTest {
        api.enqueue(json(200, idleOverview().replace(IDLE_STUDY, BUSY_SMITHING)))

        assertEquals(
            StudySlot.Busy(
                art = ArtKind.Smithing,
                targetLevel = 2,
                finishesAt = Instant.parse("2026-11-02T16:00:00.000Z"),
                cost = listOf(
                    ResourceCost(ResourceKind.Wood, 97),
                    ResourceCost(ResourceKind.Stone, 41),
                    ResourceCost(ResourceKind.Iron, 13),
                    ResourceCost(ResourceKind.Gold, 7),
                    ResourceCost(ResourceKind.Food, 3),
                ),
            ),
            readFief().study,
        )
    }

    @Test
    fun `reads each art with its resource, rate and next level`() = runTest {
        enqueueIdleFief()

        assertEquals(
            ArtState(
                kind = ArtKind.Masonry,
                level = 0,
                resource = ResourceKind.Stone,
                ratePercent = 0.0,
                nextLevel = NextArtLevel(
                    level = 1,
                    cost = listOf(
                        ResourceCost(ResourceKind.Wood, 150),
                        ResourceCost(ResourceKind.Stone, 150),
                        ResourceCost(ResourceKind.Iron, 60),
                        ResourceCost(ResourceKind.Gold, 60),
                        ResourceCost(ResourceKind.Food, 0),
                    ),
                    duration = 1800.seconds,
                    requiredLibraryLevel = 1,
                    ratePercent = 5.0,
                ),
            ),
            readFief().arts[1],
        )
    }

    @Test
    fun `keeps the fraction of an art's rate`() = runTest {
        api.enqueue(json(200, idleOverview().replace(SMITHING_AT_LEVEL_0, SMITHING_AT_A_FRACTION)))

        val smithing: ArtState = readFief().arts[0]

        assertEquals(7.5, smithing.ratePercent, 0.0)
        assertEquals(12.5, smithing.nextLevel?.ratePercent ?: 0.0, 0.0)
    }

    @Test
    fun `maps the arts in the contract's order`() = runTest {
        enqueueIdleFief()

        assertEquals(listOf(ArtKind.Smithing, ArtKind.Masonry), readFief().arts.map { it.kind })
    }

    @Test
    fun `posts the study of the art to the fief it names`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().startStudy(FiefId(LISTED_FIEF_ID), ArtKind.Masonry)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/studies", request.url.encodedPath)
        assertEquals("""{"art":"masonry"}""", request.body?.utf8())
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the overview the study returns`() = runTest {
        api.enqueue(json(200, idleOverview().replace(IDLE_STUDY, BUSY_SMITHING)))

        val result: StudyResult = repository().startStudy(FiefId(LISTED_FIEF_ID), ArtKind.Smithing)

        assertTrue((result as StudyResult.Answered).fief.study is StudySlot.Busy)
    }

    @Test
    fun `answers the study refusal the api names`() = runTest {
        val kinds: List<String> =
            listOf("StudySlotBusy", "LibraryLevelTooLow", "ArtMaxLevelReached", "InsufficientResources")
        kinds.forEach { kind: String -> api.enqueue(json(409, """{"kind":"$kind","message":"No."}""")) }
        val fiefs: FiefRepository = repository()

        val refusals: List<StudyResult> = kinds.map { fiefs.startStudy(FiefId(LISTED_FIEF_ID), ArtKind.Smithing) }

        assertEquals(
            listOf(
                StudyResult.Refused(StudyRefusal.StudySlotBusy),
                StudyResult.Refused(StudyRefusal.LibraryLevelTooLow),
                StudyResult.Refused(StudyRefusal.ArtMaxLevelReached),
                StudyResult.Refused(StudyRefusal.InsufficientResources),
            ),
            refusals,
        )
    }

    @Test
    fun `answers unreachable when the study cannot reach the api`() = runTest {
        val fiefs: FiefRepository = repository()
        api.close()

        assertEquals(StudyResult.Unreachable, fiefs.startStudy(FiefId(LISTED_FIEF_ID), ArtKind.Smithing))
    }

    @Test
    fun `deletes the study naming its art and level`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        repository().cancelStudy(FiefId(LISTED_FIEF_ID), ArtKind.Smithing, targetLevel = 2)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("DELETE", request.method)
        assertEquals("/api/fiefs/$LISTED_FIEF_ID/studies/smithing/2", request.url.encodedPath)
        assertEquals("Bearer opaque-session", request.headers["Authorization"])
    }

    @Test
    fun `answers the overview the study cancel returns`() = runTest {
        api.enqueue(resource(200, "fief-overview-idle.json"))

        val result: StudyResult = repository().cancelStudy(FiefId(LISTED_FIEF_ID), ArtKind.Smithing, targetLevel = 1)

        assertEquals(StudySlot.Idle, (result as StudyResult.Answered).fief.study)
    }

    @Test
    fun `answers the cancel of a study the api no longer holds as not found`() = runTest {
        api.enqueue(json(409, """{"kind":"StudyNotFound","message":"No."}"""))

        assertEquals(
            StudyResult.Refused(StudyRefusal.StudyNotFound),
            repository().cancelStudy(FiefId(LISTED_FIEF_ID), ArtKind.Smithing, targetLevel = 1),
        )
    }

    @Test
    fun `answers an unrecognized study refusal when the api names one the screen does not draw`() = runTest {
        api.enqueue(json(404, """{"kind":"FiefNotFound","message":"No encontramos tus tierras."}"""))

        assertEquals(
            StudyResult.Refused(StudyRefusal.Unrecognized),
            repository().cancelStudy(FiefId(LISTED_FIEF_ID), ArtKind.Masonry, targetLevel = 1),
        )
    }

    private fun enqueueIdleFief() {
        api.enqueue(resource(200, "fief-overview-idle.json"))
    }

    private suspend fun TestScope.readFief(): FiefSnapshot {
        val result: FiefReadResult = repository().read(FiefId(LISTED_FIEF_ID))
        return (result as FiefReadResult.Read).fief
    }

    private fun TestScope.repository(): FiefRepository {
        val store: TokenStore = tokenStore().apply { write("opaque-session") }
        return FiefRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun tokenStore(): TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher())

    private fun signedOut(): MockResponse = MockResponse.Builder().code(401).build()

    private fun idleOverview(): String = text("fief-overview-idle.json")

    private fun busyOverview(): String = text("fief-overview-busy.json")

    private fun text(name: String): String =
        requireNotNull(javaClass.classLoader?.getResource(name)) { "missing $name" }.readText()

    private fun resource(code: Int, name: String): MockResponse = json(code, text(name))

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val LISTED_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val SECOND_FIEF_ID: String = "7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17"
        const val WAREHOUSE_AT_LEVEL_0: String =
            """"warehouse":{"level":0,"nextLevel":{"level":1,"cost":{"wood":150,"stone":100,"iron":20,""" +
                """"gold":0,"food":0},"durationSeconds":180,"peasants":1}}"""
        const val SPRING_SEASON: String =
            """"season":{"kind":"spring","year":2,"endsAt":"2026-11-09T00:00:00.000Z",""" +
                """"multiplierPercent":{"wood":100,"stone":100,"iron":100,"gold":100,"food":125},""" +
                """"durationPercent":{"build":100,"study":100,"train":75,"road":100}}"""
        const val EMPTY_QUEUE: String = """"queue":{"entries":[],"cap":4}"""
        const val TWO_WAITING: String =
            """"queue":{"entries":[""" +
                """{"building":"sawmill","targetLevel":2,"startsAt":"2026-11-02T15:42:47.138Z",""" +
                """"finishesAt":"2026-11-02T15:50:00.000Z"},""" +
                """{"building":"ironMine","targetLevel":1,"startsAt":"2026-11-02T15:50:00.000Z",""" +
                """"finishesAt":"2026-11-02T16:10:00.000Z"}],"cap":4}"""
        const val IDLE_STUDY: String = """"study":{"kind":"idle"}"""
        const val BUSY_SMITHING: String =
            """"study":{"kind":"busy","art":"smithing","targetLevel":2,""" +
                """"startedAt":"2026-11-02T15:30:00.000Z","finishesAt":"2026-11-02T16:00:00.000Z",""" +
                """"cost":{"wood":97,"stone":41,"iron":13,"gold":7,"food":3}}"""
        const val SMITHING_AT_LEVEL_0: String =
            """"smithing":{"level":0,"resource":"iron","ratePercent":0,"nextLevel":{"level":1,""" +
                """"cost":{"wood":120,"stone":80,"iron":150,"gold":60,"food":0},"durationSeconds":1800,""" +
                """"requiredLibraryLevel":1,"ratePercent":5}}"""
        const val SMITHING_AT_A_FRACTION: String =
            """"smithing":{"level":1,"resource":"iron","ratePercent":7.5,"nextLevel":{"level":2,""" +
                """"cost":{"wood":120,"stone":80,"iron":150,"gold":60,"food":0},"durationSeconds":1800,""" +
                """"requiredLibraryLevel":1,"ratePercent":12.5}}"""
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
