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

class JobQuoteRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val target: JobTarget = JobTarget(area = 3, site = 5)

    private val team: Map<TownHireKind, Int> = mapOf(TownHireKind.Worker to 2, TownHireKind.Truck to 1)

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `asks the quote of a job with its site, team and hours`() = runTest {
        api.enqueue(json(200, QUOTE))

        town().quoteJob(target, team, hours = 2)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/jobs/quote", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"site":{"area":3,"site":5},"team":{"worker":2,"truck":1},"hours":2}""", request.body?.utf8())
    }

    @Test
    fun `answers the pay the api quotes`() = runTest {
        api.enqueue(json(200, QUOTE))

        assertEquals(
            JobQuoteResult.Quoted(
                mapOf(
                    TownResourceKind.Money to 90L,
                    TownResourceKind.Food to 0L,
                    TownResourceKind.Power to 0L,
                    TownResourceKind.Material to 30L,
                ),
            ),
            town().quoteJob(target, team, hours = 2),
        )
    }

    @Test
    fun `holds no town for a quote`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, QUOTE))

        towns.quoteJob(target, team, hours = 2)

        assertNull(towns.town.value)
    }

    @Test
    fun `carries the refusal of a quote`() = runTest {
        api.enqueue(json(409, """{"kind":"NotEnoughHiresAtHome","params":{"hire":"worker","count":2,"atHome":1}}"""))

        assertEquals(
            JobQuoteResult.Refused(TownJobRefusal.NotEnoughHiresAtHome(TownHireKind.Worker, count = 2, atHome = 1)),
            town().quoteJob(target, team, hours = 2),
        )
    }

    @Test
    fun `answers unreachable when a quote gets an empty refusal`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(JobQuoteResult.Unreachable, town().quoteJob(target, team, hours = 2))
    }

    @Test
    fun `answers unreachable when a quote cannot reach the api`() = runTest {
        api.close()

        assertEquals(JobQuoteResult.Unreachable, town().quoteJob(target, team, hours = 2))
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
        const val QUOTE: String = """{"pay":{"money":90,"food":0,"power":0,"material":30}}"""
    }
}
