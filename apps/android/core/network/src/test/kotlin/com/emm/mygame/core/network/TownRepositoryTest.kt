package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import kotlin.time.Duration.Companion.minutes
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
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TownRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val sessionEnds: SessionEnds = SessionEnds()

    private val wireNames: Map<TownBuildingKind, String> = mapOf(
        TownBuildingKind.Homes to "homes",
        TownBuildingKind.Farm to "farm",
        TownBuildingKind.Factory to "factory",
        TownBuildingKind.PowerStation to "powerStation",
        TownBuildingKind.Storage to "storage",
        TownBuildingKind.School to "school",
        TownBuildingKind.Office to "office",
    )

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `reads the town with its stocks in the catalog order`() = runTest {
        api.enqueue(json(200, TOWN))

        val answer: TownReadResult = town().read()

        val read: TownSnapshot = (answer as TownReadResult.Read).town
        assertEquals(
            listOf(
                TownSnapshot.Stock(TownResourceKind.Money, amount = 120, ratePerHour = 30.5, capacity = 1000),
                TownSnapshot.Stock(TownResourceKind.Food, amount = 80, ratePerHour = 12.0, capacity = 1000),
                TownSnapshot.Stock(TownResourceKind.Power, amount = 60, ratePerHour = 0.0, capacity = 1000),
                TownSnapshot.Stock(TownResourceKind.Material, amount = 40, ratePerHour = 7.0, capacity = 1000),
            ),
            read.stocks,
        )
    }

    @Test
    fun `reads a caught up next step with no review ahead`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.CaughtUp, read.nextStep)
        assertEquals(null, read.nextDueAt)
    }

    @Test
    fun `reads the reviews step with its count and the lessons to read first`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"reviews","count":3,"readFirst":["lesson-2","lesson-3"]}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.Reviews(3, listOf(LessonId("lesson-2"), LessonId("lesson-3"))), read.nextStep)
    }

    @Test
    fun `reads the producer a running lesson names`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonRunning","producer":"powerStation"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonRunning(NextStep.Producer.PowerStation), read.nextStep)
    }

    @Test
    fun `reads a running lesson that names no producer`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonRunning","producer":null}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonRunning(producer = null), read.nextStep)
    }

    @Test
    fun `reads the lesson to study`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonToStudy","lessonId":"lesson-2"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonToStudy(LessonId("lesson-2")), read.nextStep)
    }

    @Test
    fun `reads the next review's instant`() = runTest {
        val dueLater: String = TOWN.replace(""""nextDueAt":null""", """"nextDueAt":"2026-11-05T10:09:00.000Z"""")
        api.enqueue(json(200, dueLater))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(Instant.parse("2026-11-05T10:09:00Z"), read.nextDueAt)
    }

    @Test
    fun `holds no town until an answer names it`() = runTest {
        assertEquals(null, town().town.value)
    }

    @Test
    fun `holds a read with the gap between its instant and the device clock at its arrival`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))

        towns.read()

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `keeps the last read's gap through a work answer`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))
        api.enqueue(json(200, TOWN))
        towns.read()
        testScheduler.advanceTimeBy(30.minutes)

        towns.startWork(TownBuildingKind.Farm)

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `measures the gap of a lesson answer when no read is held`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))

        towns.startLesson(LessonId("lesson-1"))

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `holds the retained words the last read answered`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))

        towns.read()

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `drops the retained words when a read answers none`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))
        api.enqueue(json(200, TOWN))
        towns.read()

        towns.read()

        assertEquals(null, towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `drops the retained words when the player holds no town`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))
        towns.read()

        towns.read()

        assertEquals(null, towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `keeps the retained words through a failed read`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))
        api.enqueue(json(500, "{}"))
        towns.read()

        towns.read()

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `holds the retained words a lesson's answer names`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))

        towns.startLesson(LessonId("lesson-1"))

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `holds the retained words a work answer names`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_RETAINED_WORDS))

        towns.startWork(TownBuildingKind.Farm)

        assertEquals(RetainedWords(count = 3, total = 5), towns.town.value?.town?.learning?.retainedWords)
    }

    @Test
    fun `reads each place with its next level`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Building(
                kind = TownBuildingKind.Homes,
                level = 1,
                next = TownSnapshot.NextLevel(
                    level = 2,
                    costs = listOf(
                        TownSnapshot.Cost(TownResourceKind.Money, 60),
                        TownSnapshot.Cost(TownResourceKind.Material, 30),
                    ),
                    duration = 90.seconds,
                    people = 3,
                ),
            ),
            read.buildings.first(),
        )
    }

    @Test
    fun `reads a place at its top level with no next level`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.Building(TownBuildingKind.Office, level = 10, next = null), read.buildings.last())
    }

    @Test
    fun `reads the slot and the waiting list of the building work`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Work(
                slot = TownSnapshot.WorkItem(
                    building = TownBuildingKind.Farm,
                    level = 2,
                    startsAt = Instant.parse("2026-11-05T10:00:00.000Z"),
                    finishesAt = Instant.parse("2026-11-05T10:10:00.000Z"),
                ),
                waitingList = listOf(
                    TownSnapshot.WorkItem(
                        building = TownBuildingKind.School,
                        level = 3,
                        startsAt = Instant.parse("2026-11-05T10:10:00.000Z"),
                        finishesAt = Instant.parse("2026-11-05T10:30:00.000Z"),
                    ),
                ),
                cap = 2,
            ),
            read.work,
        )
    }

    @Test
    fun `reads the season in force`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(SeasonInForce(SeasonKind.Fall, year = 1), read.seasonInForce)
    }

    @Test
    fun `reads the instants that change the town on their own`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(Instant.parse("2026-11-08T00:00:00.000Z"), Instant.parse("2026-11-05T10:20:00.000Z")),
            listOf(read.seasonEndsAt, read.lessonSlot?.finishesAt),
        )
    }

    @Test
    fun `answers no town when the api finds none`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(TownReadResult.NoTown, town().read())
    }

    @Test
    fun `answers unreachable when a read fails`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `founds the town with the name the player wrote`() = runTest {
        api.enqueue(json(200, TOWN))

        town().found("  Riverton ")

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"name":"  Riverton "}""", request.body?.utf8())
    }

    @Test
    fun `answers the founded town`() = runTest {
        api.enqueue(json(200, TOWN))

        assertEquals("Riverton", (town().found("Riverton") as TownFoundResult.Founded).town.name)
    }

    @Test
    fun `hands a blank name refusal to the caller`() = runTest {
        api.enqueue(json(400, """{"kind":"BlankTownName"}"""))

        assertEquals(TownFoundResult.Refused(TownFoundRefusal.BlankTownName), town().found(" "))
    }

    @Test
    fun `hands the refusal of a second town to the caller`() = runTest {
        api.enqueue(json(409, """{"kind":"PlayerAlreadyHoldsTown"}"""))

        assertEquals(TownFoundResult.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown), town().found("Riverton"))
    }

    @Test
    fun `answers unreachable when a founding loses its site`() = runTest {
        api.enqueue(MockResponse.Builder().code(409).build())

        assertEquals(TownFoundResult.Unreachable, town().found("Riverton"))
    }

    @Test
    fun `starts work by naming only the place`() = runTest {
        api.enqueue(json(200, TOWN))

        town().startWork(TownBuildingKind.PowerStation)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/work", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"building":"powerStation"}""", request.body?.utf8())
    }

    @Test
    fun `stops work by its place and level`() = runTest {
        api.enqueue(json(200, TOWN))

        town().stopWork(TownBuildingKind.PowerStation, level = 3)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("DELETE /api/town/work/powerStation/3", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `names each place on the wire when it starts work`() = runTest {
        wireNames.forEach { (kind: TownBuildingKind, wire: String) ->
            api.enqueue(json(200, TOWN))

            town().startWork(kind)

            assertEquals("""{"building":"$wire"}""", api.takeRequestWithin().body?.utf8())
        }
    }

    @Test
    fun `names each place on the wire when it stops work`() = runTest {
        wireNames.forEach { (kind: TownBuildingKind, wire: String) ->
            api.enqueue(json(200, TOWN))

            town().stopWork(kind, level = 3)

            assertEquals("/api/town/work/$wire/3", api.takeRequestWithin().url.encodedPath)
        }
    }

    @Test
    fun `reads each place from its own key`() = runTest {
        val levels: String = TOWN
            .replace(""""farm":$FLAT""", """"farm":{"level":2,"nextLevel":null}""")
            .replace(""""factory":$FLAT""", """"factory":{"level":3,"nextLevel":null}""")
            .replace(""""powerStation":$FLAT""", """"powerStation":{"level":4,"nextLevel":null}""")
            .replace(""""storage":$FLAT""", """"storage":{"level":5,"nextLevel":null}""")
            .replace(""""school":$FLAT""", """"school":{"level":6,"nextLevel":null}""")
        api.enqueue(json(200, levels))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(
                TownBuildingKind.Homes to 1,
                TownBuildingKind.Farm to 2,
                TownBuildingKind.Factory to 3,
                TownBuildingKind.PowerStation to 4,
                TownBuildingKind.Storage to 5,
                TownBuildingKind.School to 6,
                TownBuildingKind.Office to 10,
            ),
            read.buildings.map { place: TownSnapshot.Building -> place.kind to place.level },
        )
    }

    @Test
    fun `carries the cap of a full waiting list`() = runTest {
        api.enqueue(json(409, """{"kind":"WaitingListFull","params":{"cap":2}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.WaitingListFull(cap = 2)),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `carries the people a work needs and the people free`() = runTest {
        api.enqueue(json(409, """{"kind":"NotEnoughPeople","params":{"requiredPeople":5,"freePeople":2}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.NotEnoughPeople(required = 5, free = 2)),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `reads a shortfall refusal`() = runTest {
        api.enqueue(
            json(
                409,
                """{"kind":"NotEnoughResources","params":{"missing":{"money":1,"food":0,"power":0,"material":0}}}""",
            ),
        )

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.NotEnoughResources),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `carries the level of a place at its top`() = runTest {
        api.enqueue(json(409, """{"kind":"TopLevelReached","params":{"building":"farm","level":10}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.TopLevelReached(level = 10)),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `carries the level of a work no longer on the list`() = runTest {
        api.enqueue(json(409, """{"kind":"BuildingWorkNotFound","params":{"building":"farm","level":4}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.BuildingWorkNotFound(level = 4)),
            town().stopWork(TownBuildingKind.Farm, level = 4),
        )
    }

    @Test
    fun `reads the refusal of work for a player with no town`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.TownNotFound),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `answers an unknown refusal as unrecognized`() = runTest {
        api.enqueue(json(409, """{"kind":"QueueFull"}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.Unrecognized),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `answers unreachable when work gets an empty refusal`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(TownWorkResult.Unreachable, town().stopWork(TownBuildingKind.Farm, level = 2))
    }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = signedIn(),
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, aMinuteBeforeTheRead),
    )

    private fun signedIn(): TokenStore =
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }

    private fun townWithNextStep(step: String): String = TOWN.replace("""{"kind":"caughtUp"}""", step)

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        val aMinuteBeforeTheRead: Instant = Instant.parse("2026-11-05T10:04:00Z")
        const val NOTHING: String = """{"money":0,"food":0,"power":0,"material":0}"""
        const val HOMES_COST: String = """{"money":60,"food":0,"power":0,"material":30}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val TOWN: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":1,"site":1},"terrain":"fields",""" +
                """"season":{"kind":"fall","year":1,"endsAt":"2026-11-08T00:00:00.000Z"},""" +
                """"stocks":{"money":{"amount":120,"ratePerHour":30.5,"capacity":1000},""" +
                """"food":{"amount":80,"ratePerHour":12,"capacity":1000},""" +
                """"power":{"amount":60,"ratePerHour":0,"capacity":1000},""" +
                """"material":{"amount":40,"ratePerHour":7,"capacity":1000}},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":{"level":1,"nextLevel":{"level":2,"cost":$HOMES_COST,""" +
                """"durationSeconds":90,"people":3}},"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":{"level":10,"nextLevel":null}},""" +
                """"work":{"slot":{"building":"farm","level":2,"cost":$NOTHING,""" +
                """"startsAt":"2026-11-05T10:00:00.000Z","finishesAt":"2026-11-05T10:10:00.000Z"},""" +
                """"waitingList":[{"building":"school","level":3,"cost":$NOTHING,""" +
                """"startsAt":"2026-11-05T10:10:00.000Z","finishesAt":"2026-11-05T10:30:00.000Z"}],"cap":2},""" +
                """"lessons":[],"skills":[],""" +
                """"lessonSlot":{"lessonId":"lesson-1","startedAt":"2026-11-05T10:00:00.000Z",""" +
                """"finishesAt":"2026-11-05T10:20:00.000Z"},""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"nextStep":{"kind":"caughtUp"},"nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""

        val TOWN_WITH_RETAINED_WORDS: String =
            TOWN.replace(""""retainedWords":null""", """"retainedWords":{"count":3,"total":5}""")
    }
}
