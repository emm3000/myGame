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
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class CleanUpRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val target: JobTarget = JobTarget(area = 1, site = 12)

    private val team: Map<TownHireKind, Int> = mapOf(TownHireKind.Worker to 6, TownHireKind.Truck to 0)

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `sends a clean-up with its site and team`() = runTest {
        api.enqueue(json(200, TOWN_WITH_CLEAN_UP))

        town().sendCleanUp(target, team)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/clean-ups", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"site":{"area":1,"site":12},"team":{"worker":6,"truck":0}}""", request.body?.utf8())
    }

    @Test
    fun `answers and holds the town a sent clean-up returns`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_CLEAN_UP))

        val answer: TownJobResult = towns.sendCleanUp(target, team)

        val answered: TownSnapshot = (answer as TownJobResult.Answered).town
        assertEquals(TownSnapshot.JobTask.CleanUp(size = WasteSize.Small, waste = 6), answered.job?.task)
        assertEquals(answered, towns.town.value?.town)
    }

    @Test
    fun `reads the refusals of a site with no waste to clean`() = runTest {
        val refusals: Map<String, TownJobRefusal> = mapOf(
            "NotAWasteSite" to TownJobRefusal.NotAWasteSite,
            "NoWasteYet" to TownJobRefusal.NoWasteYet,
        )
        val towns: TownRepository = town()

        refusals.forEach { (kind: String, refusal: TownJobRefusal) ->
            api.enqueue(json(409, """{"kind":"$kind"}"""))

            assertEquals(TownJobResult.Refused(refusal), towns.sendCleanUp(target, team))
        }
    }

    @Test
    fun `answers unreachable when a clean-up cannot reach the api`() = runTest {
        api.close()

        assertEquals(TownJobResult.Unreachable, town().sendCleanUp(target, team))
    }

    @Test
    fun `asks the quote of a clean-up with its site and team`() = runTest {
        api.enqueue(json(200, QUOTE))

        town().quoteCleanUp(target, team)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/clean-ups/quote", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"site":{"area":1,"site":12},"team":{"worker":6,"truck":0}}""", request.body?.utf8())
    }

    @Test
    fun `answers the strength, the waste, the pay and the cover the api quotes`() = runTest {
        api.enqueue(json(200, QUOTE))

        assertEquals(
            CleanUpQuoteResult.Quoted(
                strength = 6,
                waste = 12,
                pay = mapOf(
                    TownResourceKind.Money to 24L,
                    TownResourceKind.Food to 0L,
                    TownResourceKind.Power to 0L,
                    TownResourceKind.Material to 36L,
                ),
                covers = false,
            ),
            town().quoteCleanUp(target, team),
        )
    }

    @Test
    fun `holds no town for a clean-up quote`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, QUOTE))

        towns.quoteCleanUp(target, team)

        assertNull(towns.town.value)
    }

    @Test
    fun `carries the refusal of a clean-up quote`() = runTest {
        api.enqueue(json(409, """{"kind":"NoWasteYet"}"""))

        assertEquals(CleanUpQuoteResult.Refused(TownJobRefusal.NoWasteYet), town().quoteCleanUp(target, team))
    }

    @Test
    fun `answers unreachable when a clean-up quote gets an empty refusal`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(CleanUpQuoteResult.Unreachable, town().quoteCleanUp(target, team))
    }

    @Test
    fun `answers unreachable when a clean-up quote cannot reach the api`() = runTest {
        api.close()

        assertEquals(CleanUpQuoteResult.Unreachable, town().quoteCleanUp(target, team))
    }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") },
        sessionEnds = SessionEnds(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:04:00Z")),
    )

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val QUOTE: String =
            """{"strength":6,"waste":12,"pay":{"money":24,"food":0,"power":0,"material":36},"covers":false}"""
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val TERMS: String =
            """{"cost":{"money":40,"food":0,"power":0,"material":0},"secondsPerHire":60,""" +
                """"people":1,"requiredOfficeLevel":1}"""
        const val CLEAN_UP: String =
            """{"kind":"cleanUp","site":{"region":1,"area":1,"site":12},"team":{"worker":6,"truck":0},""" +
                """"size":1,"waste":6,"pay":{"money":12,"food":0,"power":0,"material":18},"phase":"outbound",""" +
                """"sentAt":"2026-11-05T10:00:00.000Z","arrivesAt":"2026-11-05T10:11:00.000Z",""" +
                """"leavesAt":"2026-11-05T10:11:00.000Z","returnsAt":"2026-11-05T10:22:00.000Z",""" +
                """"calledBackAt":null}"""
        const val TOWN_WITH_CLEAN_UP: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":1,"site":1},"terrain":"fields",""" +
                """"season":null,"stocks":{"money":$STOCK,"food":$STOCK,"power":$STOCK,"material":$STOCK},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":$FLAT,"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":$FLAT},""" +
                """"work":{"slot":null,"waitingList":[],"cap":2},""" +
                """"hiring":{"order":null,"hires":{"worker":0,"truck":0},""" +
                """"terms":{"worker":$TERMS,"truck":$TERMS}},"job":$CLEAN_UP,""" +
                """"lessons":[],"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"nextStep":{"kind":"caughtUp"},"nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""
    }
}
