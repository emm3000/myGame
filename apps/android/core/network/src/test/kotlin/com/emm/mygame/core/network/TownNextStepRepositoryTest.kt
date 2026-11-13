package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TownNextStepRepositoryTest {

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
    fun `reads the due check step with its band and week`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"holdoutCheck","band":2,"week":24}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth), read.nextStep)
    }

    @Test
    fun `reads the released lesson step with its band and set`() = runTest {
        val step: String = """{"kind":"releasedLesson","lessonId":"released-1-2","band":1,"position":2}"""
        api.enqueue(json(200, townWithNextStep(step)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            NextStep.ReleasedLesson(LessonId("released-1-2"), PlacementBand.First, position = 2),
            read.nextStep,
        )
    }

    @Test
    fun `answers unreachable for a check step on a week the client does not know`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"holdoutCheck","band":1,"week":52}""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads the released lessons apart from the lessons`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$RELEASED]""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(
                TownSnapshot.ReleasedLesson(
                    id = LessonId("released-2-1"),
                    band = PlacementBand.Second,
                    position = 1,
                    duration = 5.minutes,
                    requiredSchoolLevel = 1,
                    isStudied = false,
                    wordCount = 1,
                ),
            ),
            read.releasedLessons,
        )
    }

    @Test
    fun `never adds a released lesson to the lessons`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$RELEASED]""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(emptyList<TownSnapshot.Lesson>(), read.lessons)
    }

    @Test
    fun `answers unreachable for a released lesson on a band the client does not know`() = runTest {
        val unknownBand: String = RELEASED.replace(""""band":2""", """"band":7""")
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$unknownBand]""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    private fun TestScope.town(): TownRepository {
        val store: TokenStore =
            TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }
        return TownRepository(
            baseUrl = api.url("/api/").toString(),
            tokenStore = store,
            languages = PlayerLanguages(store),
            sessionEnds = SessionEnds(),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
            clock = TestClock(testScheduler, Instant.parse("2026-11-13T10:00:00Z")),
        )
    }

    private fun townWithNextStep(step: String): String = TOWN.replace("""{"kind":"caughtUp","goal":null}""", step)

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000,"fullAt":null}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val RELEASED: String =
            """{"id":"released-2-1","band":2,"position":1,"durationSeconds":300,"requiredSchoolLevel":1,""" +
                """"isStudied":false,"words":[{"wordId":"word-1","standing":"notStarted","reading":null,""" +
                """"support":null}]}"""
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
                """"lessons":[],"releasedLessons":[],"dueHoldoutChecks":[],"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"nextStep":{"kind":"caughtUp","goal":null},"tip":null,""" +
                """"chromePhase":"scaffold","nextDueAt":null,""" +
                """"readAt":"2026-11-13T10:00:00.000Z"}"""
    }
}
