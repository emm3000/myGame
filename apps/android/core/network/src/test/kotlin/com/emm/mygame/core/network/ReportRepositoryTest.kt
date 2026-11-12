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
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReportRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val occurredAt: Instant = Instant.parse("2026-11-05T09:10:00Z")

    private val firstSite: TownSite = TownSite(region = 1, area = 2, site = 3)

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `reads the report at its path with the bearer`() = runTest {
        api.enqueue(json(200, reportOf()))

        reports().read()

        val request: RecordedRequest = api.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/report", request.url.encodedPath)
        assertEquals("Bearer opaque-token", request.headers["Authorization"])
    }

    @Test
    fun `reads the count of reviews due`() = runTest {
        api.enqueue(json(200, reportOf(dueCount = 3)))

        assertEquals(3, read().dueCount)
    }

    @Test
    fun `reads the next review's instant`() = runTest {
        api.enqueue(json(200, reportOf(nextDueAt = """"2026-11-05T10:09:00.000Z"""")))

        assertEquals(Instant.parse("2026-11-05T10:09:00Z"), read().nextDueAt)
    }

    @Test
    fun `reads no instant when no review lies ahead`() = runTest {
        api.enqueue(json(200, reportOf()))

        assertEquals(null, read().nextDueAt)
    }

    @Test
    fun `reads the lessons to read first in the order the api answers`() = runTest {
        api.enqueue(json(200, reportOf(dueCount = 3, readFirst = """"lesson-2","lesson-3"""")))

        assertEquals(listOf(LessonId("lesson-2"), LessonId("lesson-3")), read().readFirst)
    }

    @Test
    fun `reads a building work finished`() = runTest {
        api.enqueue(json(200, reportOf(news = buildingWork("buildingWorkFinished", "powerStation"))))

        assertEquals(
            listOf(TownNews.BuildingWorkFinished(occurredAt, TownBuildingKind.PowerStation, level = 2)),
            read().news,
        )
    }

    @Test
    fun `reads a building work stopped`() = runTest {
        api.enqueue(json(200, reportOf(news = stoppedWork())))

        assertEquals(
            listOf(TownNews.BuildingWorkStopped(occurredAt, TownBuildingKind.Farm, level = 2)),
            read().news,
        )
    }

    @Test
    fun `reads a lesson studied`() = runTest {
        api.enqueue(json(200, reportOf(news = lesson("lessonStudied"))))

        assertEquals(listOf(TownNews.LessonStudied(occurredAt)), read().news)
    }

    @Test
    fun `reads a lesson stopped`() = runTest {
        api.enqueue(json(200, reportOf(news = lesson("lessonStopped"))))

        assertEquals(listOf(TownNews.LessonStopped(occurredAt)), read().news)
    }

    @Test
    fun `reads a skill earned`() = runTest {
        api.enqueue(json(200, reportOf(news = skill("food"))))

        assertEquals(
            listOf(TownNews.SkillEarned(occurredAt, TownResourceKind.Food, ratePercent = 5)),
            read().news,
        )
    }

    @Test
    fun `reads a hiring delivered`() = runTest {
        api.enqueue(json(200, reportOf(news = hiringDelivered("worker"))))

        assertEquals(listOf(TownNews.HiringDelivered(occurredAt, TownHireKind.Worker, count = 4)), read().news)
    }

    @Test
    fun `reads a hiring stopped`() = runTest {
        api.enqueue(json(200, reportOf(news = hiringStopped("truck"))))

        assertEquals(
            listOf(TownNews.HiringStopped(occurredAt, TownHireKind.Truck, delivered = 1, stopped = 4)),
            read().news,
        )
    }

    @Test
    fun `reads a job back with its pay`() = runTest {
        api.enqueue(json(200, reportOf(news = job("jobBack"))))

        assertEquals(
            listOf(TownNews.JobBack(occurredAt, firstSite, listOf(TownAmount(TownResourceKind.Food, 40)))),
            read().news,
        )
    }

    @Test
    fun `reads a job called back with its pay`() = runTest {
        api.enqueue(json(200, reportOf(news = job("jobCalledBack"))))

        assertEquals(
            listOf(TownNews.JobCalledBack(occurredAt, firstSite, listOf(TownAmount(TownResourceKind.Food, 40)))),
            read().news,
        )
    }

    @Test
    fun `reads a clean-up done with its reward`() = runTest {
        api.enqueue(json(200, reportOf(news = cleanUpDone(money = 1, food = 2, power = 3, material = 4))))

        assertEquals(
            listOf(
                TownNews.CleanUpDone(
                    occurredAt,
                    firstSite,
                    listOf(
                        TownAmount(TownResourceKind.Money, 1),
                        TownAmount(TownResourceKind.Food, 2),
                        TownAmount(TownResourceKind.Power, 3),
                        TownAmount(TownResourceKind.Material, 4),
                    ),
                ),
            ),
            read().news,
        )
    }

    @Test
    fun `leaves out a resource the reward does not hold`() = runTest {
        api.enqueue(json(200, reportOf(news = cleanUpDone(money = 0, food = 0, power = 3, material = 0))))

        val reward: List<TownAmount> = (read().news.single() as TownNews.CleanUpDone).reward

        assertEquals(listOf(TownAmount(TownResourceKind.Power, 3)), reward)
    }

    @Test
    fun `reads a clean-up failed`() = runTest {
        api.enqueue(json(200, reportOf(news = cleanUpFailed())))

        assertEquals(listOf(TownNews.CleanUpFailed(occurredAt, firstSite)), read().news)
    }

    @Test
    fun `reads the town becoming a city`() = runTest {
        api.enqueue(json(200, reportOf(news = becameCity())))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `keeps the news in the order the api answers`() = runTest {
        api.enqueue(json(200, reportOf(news = "${lesson("lessonStopped")},${becameCity()}")))

        assertEquals(listOf(TownNews.LessonStopped(occurredAt), TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `skips a news kind the client does not know`() = runTest {
        val unknownKind = """{"kind":"festivalHeld","occurredAt":"2026-11-05T09:10:00.000Z"}"""
        api.enqueue(json(200, reportOf(news = "$unknownKind,${becameCity()}")))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `skips a building the client does not know`() = runTest {
        api.enqueue(json(200, reportOf(news = "${buildingWork("buildingWorkFinished", "castle")},${becameCity()}")))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `skips a stopped building the client does not know`() = runTest {
        api.enqueue(json(200, reportOf(news = "${stoppedWork(building = "castle")},${becameCity()}")))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `skips a skill whose resource the client does not know`() = runTest {
        api.enqueue(json(200, reportOf(news = "${skill("coal")},${becameCity()}")))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `skips a delivered hire the client does not know`() = runTest {
        api.enqueue(json(200, reportOf(news = "${hiringDelivered("horse")},${becameCity()}")))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `skips a stopped hire the client does not know`() = runTest {
        api.enqueue(json(200, reportOf(news = "${hiringStopped("horse")},${becameCity()}")))

        assertEquals(listOf(TownNews.BecameCity(occurredAt)), read().news)
    }

    @Test
    fun `answers unreachable for a news with no kind`() = runTest {
        api.enqueue(json(200, reportOf(news = """{"occurredAt":"2026-11-05T09:10:00.000Z"}""")))

        assertEquals(ReportReadResult.Unreachable, reports().read())
    }

    @Test
    fun `answers unreachable for a malformed news of a known kind`() = runTest {
        api.enqueue(json(200, reportOf(news = """{"kind":"becameCity"}""")))

        assertEquals(ReportReadResult.Unreachable, reports().read())
    }

    @Test
    fun `answers unreachable for a body that is not a report`() = runTest {
        api.enqueue(json(200, "[]"))

        assertEquals(ReportReadResult.Unreachable, reports().read())
    }

    @Test
    fun `answers unreachable for a server error`() = runTest {
        api.enqueue(json(500, "{}"))

        assertEquals(ReportReadResult.Unreachable, reports().read())
    }

    @Test
    fun `answers unreachable when the api cannot be reached`() = runTest {
        val repository: ReportRepository = reports()
        api.close()

        assertEquals(ReportReadResult.Unreachable, repository.read())
    }

    @Test
    fun `closes the report at its path with the bearer`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        val answer: ReportCloseResult = reports().close()

        val request: RecordedRequest = api.takeRequest()
        assertEquals(ReportCloseResult.Closed, answer)
        assertEquals("POST", request.method)
        assertEquals("/report/close", request.url.encodedPath)
        assertEquals("Bearer opaque-token", request.headers["Authorization"])
    }

    @Test
    fun `answers unreachable when the close fails`() = runTest {
        api.enqueue(json(500, "{}"))

        assertEquals(ReportCloseResult.Unreachable, reports().close())
    }

    @Test
    fun `answers unreachable when the close cannot reach the api`() = runTest {
        val repository: ReportRepository = reports()
        api.close()

        assertEquals(ReportCloseResult.Unreachable, repository.close())
    }

    @Test
    fun `reads the town news at its path with the bearer`() = runTest {
        api.enqueue(json(200, feedOf()))

        reports().news()

        val request: RecordedRequest = api.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/town/news", request.url.encodedPath)
        assertEquals("Bearer opaque-token", request.headers["Authorization"])
    }

    @Test
    fun `reads the town news in the order the api answers`() = runTest {
        api.enqueue(json(200, feedOf("${becameCity()},${lesson("lessonStudied")}")))

        assertEquals(
            TownNewsReadResult.Read(listOf(TownNews.BecameCity(occurredAt), TownNews.LessonStudied(occurredAt))),
            reports().news(),
        )
    }

    @Test
    fun `skips a town news kind the client does not know`() = runTest {
        val unknownKind: String = """{"kind":"festivalHeld","occurredAt":"2026-11-05T09:10:00.000Z"}"""
        api.enqueue(json(200, feedOf("$unknownKind,${becameCity()}")))

        assertEquals(TownNewsReadResult.Read(listOf(TownNews.BecameCity(occurredAt))), reports().news())
    }

    @Test
    fun `answers unreachable for a body that is not a news feed`() = runTest {
        api.enqueue(json(200, "[]"))

        assertEquals(TownNewsReadResult.Unreachable, reports().news())
    }

    @Test
    fun `answers unreachable when the town news fails`() = runTest {
        api.enqueue(json(500, "{}"))

        assertEquals(TownNewsReadResult.Unreachable, reports().news())
    }

    @Test
    fun `answers unreachable when the town news cannot reach the api`() = runTest {
        val repository: ReportRepository = reports()
        api.close()

        assertEquals(TownNewsReadResult.Unreachable, repository.news())
    }

    private suspend fun TestScope.read(): TownReport = (reports().read() as ReportReadResult.Read).report

    private fun TestScope.reports(): ReportRepository {
        val store: TokenStore = TokenStore(file = File(folder.root, "session"), cipher = FakeTokenCipher())
        store.write("opaque-token")
        return ReportRepository(
            baseUrl = api.url("/").toString(),
            tokenStore = store,
            sessionEnds = SessionEnds(),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private fun reportOf(
        dueCount: Int = 0,
        news: String = "",
        readFirst: String = "",
        nextDueAt: String = "null",
    ): String = """{"dueCount":$dueCount,"due":[],"readFirst":[$readFirst],"nextDueAt":$nextDueAt,"news":[$news]}"""

    private fun feedOf(items: String = ""): String = """{"items":[$items]}"""

    private fun buildingWork(kind: String, building: String): String =
        """{"kind":"$kind","params":{"building":"$building","level":2},"occurredAt":"$OCCURRED_AT"}"""

    private fun stoppedWork(building: String = "farm"): String =
        """{"kind":"buildingWorkStopped","params":{"building":"$building","level":2,"refund":$NO_AMOUNTS},""" +
            """"occurredAt":"$OCCURRED_AT"}"""

    private fun lesson(kind: String): String =
        """{"kind":"$kind","params":{"lessonId":"lesson-1"},"occurredAt":"$OCCURRED_AT"}"""

    private fun skill(resource: String): String =
        """{"kind":"skillEarned","params":{"lessonId":"lesson-1","resource":"$resource","ratePercent":5},""" +
            """"occurredAt":"$OCCURRED_AT"}"""

    private fun hiringDelivered(hire: String): String =
        """{"kind":"hiringDelivered","params":{"hire":"$hire","count":4},"occurredAt":"$OCCURRED_AT"}"""

    private fun hiringStopped(hire: String): String =
        """{"kind":"hiringStopped","params":{"hire":"$hire","delivered":1,"stopped":4,"refund":$NO_AMOUNTS},""" +
            """"occurredAt":"$OCCURRED_AT"}"""

    private fun job(kind: String): String =
        """{"kind":"$kind","params":{"site":$SITE,"pay":{"money":0,"food":40,"power":0,"material":0}},""" +
            """"occurredAt":"$OCCURRED_AT"}"""

    private fun cleanUpDone(money: Int, food: Int, power: Int, material: Int): String =
        """{"kind":"cleanUpDone","params":{"site":$SITE,""" +
            """"reward":{"money":$money,"food":$food,"power":$power,"material":$material}},""" +
            """"occurredAt":"$OCCURRED_AT"}"""

    private fun cleanUpFailed(): String =
        """{"kind":"cleanUpFailed","params":{"site":$SITE},"occurredAt":"$OCCURRED_AT"}"""

    private fun becameCity(): String = """{"kind":"becameCity","occurredAt":"$OCCURRED_AT"}"""

    private companion object {
        const val OCCURRED_AT: String = "2026-11-05T09:10:00.000Z"
        const val SITE: String = """{"region":1,"area":2,"site":3}"""
        const val NO_AMOUNTS: String = """{"money":0,"food":0,"power":0,"material":0}"""
    }
}
