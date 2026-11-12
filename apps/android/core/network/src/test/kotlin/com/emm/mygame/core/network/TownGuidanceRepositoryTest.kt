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
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TownGuidanceRepositoryTest {

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
    fun `reads a caught up step with no goal left`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.CaughtUp(goal = null), read.nextStep)
    }

    @Test
    fun `reads a pending goal with the resources and the people it misses`() = runTest {
        api.enqueue(json(200, townWithGoal(PENDING_GOAL)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        val expected = TownGoal(
            position = 2,
            count = 9,
            building = TownBuildingKind.Factory,
            level = 1,
            state = TownGoal.State.Pending(
                resources = listOf(
                    TownSnapshot.Cost(TownResourceKind.Money, 40),
                    TownSnapshot.Cost(TownResourceKind.Material, 15),
                ),
                people = 3,
            ),
        )
        assertEquals(NextStep.CaughtUp(expected), read.nextStep)
    }

    @Test
    fun `reads a goal underway`() = runTest {
        api.enqueue(json(200, townWithGoal(UNDERWAY_GOAL)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        val expected = TownGoal(
            position = 1,
            count = 9,
            building = TownBuildingKind.PowerStation,
            level = 1,
            state = TownGoal.State.Underway,
        )
        assertEquals(NextStep.CaughtUp(expected), read.nextStep)
    }

    @Test
    fun `answers unreachable for a goal on a place the client does not know`() = runTest {
        api.enqueue(json(200, townWithGoal(UNDERWAY_GOAL.replace("powerStation", "harbor"))))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads no tip when the api names none`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, read.tip)
    }

    @Test
    fun `reads the tip to show`() = runTest {
        api.enqueue(json(200, townWithTip("waitingList")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TipKind.WaitingList, read.tip)
    }

    @Test
    fun `reads no tip for a tip the client does not know`() = runTest {
        api.enqueue(json(200, townWithTip("harbor")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, read.tip)
    }

    @Test
    fun `marks a tip seen by its name on the wire`() = runTest {
        val wireNames: Map<TipKind, String> = mapOf(
            TipKind.People to "people",
            TipKind.Seasons to "seasons",
            TipKind.WaitingList to "waitingList",
            TipKind.Office to "office",
            TipKind.Jobs to "jobs",
            TipKind.FullStore to "fullStore",
        )
        val repository: TownRepository = town()

        val paths: List<String?> = TipKind.entries.map { tip: TipKind ->
            api.enqueue(MockResponse.Builder().code(204).build())
            repository.markTipSeen(tip)
            val request: RecordedRequest = api.takeRequestWithin()
            "${request.method} ${request.url.encodedPath}"
        }

        val expected: List<String> = TipKind.entries.map { tip: TipKind ->
            "POST /api/town/tips/${wireNames.getValue(tip)}"
        }
        assertEquals(expected, paths)
    }

    @Test
    fun `answers marked when the api marks the tip seen`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        assertEquals(TownGuidanceResult.Marked, town().markTipSeen(TipKind.Office))
    }

    @Test
    fun `answers unreachable when the api refuses the tip`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(TownGuidanceResult.Unreachable, town().markTipSeen(TipKind.Office))
    }

    @Test
    fun `dismisses the guidance`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        town().dismissGuidance()

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/guidance/dismissal", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `answers marked when the api dismisses the guidance`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        assertEquals(TownGuidanceResult.Marked, town().dismissGuidance())
    }

    @Test
    fun `answers unreachable when the guidance finds no town`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(TownGuidanceResult.Unreachable, town().dismissGuidance())
    }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") },
        sessionEnds = SessionEnds(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, aMinuteBeforeTheRead),
    )

    private fun townWithGoal(goal: String): String = TOWN.replace(""""goal":null""", """"goal":$goal""")

    private fun townWithTip(tip: String): String = TOWN.replace(""""tip":null""", """"tip":"$tip"""")

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        val aMinuteBeforeTheRead: Instant = Instant.parse("2026-11-05T10:04:00Z")
        const val PENDING_GOAL: String =
            """{"position":2,"count":9,"building":"factory","level":1,"state":"pending",""" +
                """"missing":{"resources":{"money":40,"food":0,"power":0,"material":15},"people":3}}"""
        const val UNDERWAY_GOAL: String =
            """{"position":1,"count":9,"building":"powerStation","level":1,"state":"underway"}"""
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val HIRING: String =
            """{"order":null,"hires":{"worker":0,"truck":0},"terms":{""" +
                """"worker":{"cost":{"money":40,"food":0,"power":0,"material":0},"secondsPerHire":60,""" +
                """"people":1,"requiredOfficeLevel":1},""" +
                """"truck":{"cost":{"money":80,"food":40,"power":40,"material":60},"secondsPerHire":180,""" +
                """"people":1,"requiredOfficeLevel":3}}}"""
        const val TOWN: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":1,"site":1},"terrain":"fields",""" +
                """"season":null,"stocks":{"money":$STOCK,"food":$STOCK,"power":$STOCK,"material":$STOCK},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":$FLAT,"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":$FLAT},""" +
                """"work":{"slot":null,"waitingList":[],"cap":2},""" +
                """"hiring":$HIRING,"job":null,""" +
                """"lessons":[],"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"nextStep":{"kind":"caughtUp","goal":null},"tip":null,"nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""
    }
}
