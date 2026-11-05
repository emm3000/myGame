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
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TownLessonsRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val firstLesson: LessonId = LessonId("lesson-1")

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `reads each lesson with its terms and its word count`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(
                TownSnapshot.Lesson(
                    id = firstLesson,
                    theme = "A day in town",
                    duration = 150.seconds,
                    requiredSchoolLevel = 2,
                    skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
                    isStudied = true,
                    wordCount = 2,
                ),
            ),
            read.lessons,
        )
    }

    @Test
    fun `reads each earned skill with its resource and percent`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(TownSnapshot.EarnedSkill(firstLesson, TownResourceKind.Food, ratePercent = 5)),
            read.skills,
        )
    }

    @Test
    fun `reads the learning cap and the words in learning`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.Learning(cap = 10, inLearning = 8), read.learning)
    }

    @Test
    fun `reads the running lesson with its instants`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.LessonSlot(
                lesson = firstLesson,
                startedAt = Instant.parse("2026-11-05T10:00:00.000Z"),
                finishesAt = Instant.parse("2026-11-05T10:20:00.000Z"),
            ),
            read.lessonSlot,
        )
    }

    @Test
    fun `answers unreachable for a skill on a resource the client does not know`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""resource":"food","ratePercent":5,"earnedAt"""", UNKNOWN_SKILL)))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `answers unreachable for a lesson on a resource the client does not know`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""skill":{"resource":"food"""", """"skill":{"resource":"oil"""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `starts a lesson by naming only the lesson`() = runTest {
        api.enqueue(json(200, TOWN))

        town().startLesson(firstLesson)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/lessons", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"lessonId":"lesson-1"}""", request.body?.utf8())
    }

    @Test
    fun `stops a lesson by its id`() = runTest {
        api.enqueue(json(200, TOWN))

        town().stopLesson(firstLesson)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("DELETE /api/town/lessons/lesson-1", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `answers the town a started lesson returns`() = runTest {
        api.enqueue(json(200, TOWN))

        val answer: TownLessonResult = town().startLesson(firstLesson)

        assertEquals("Riverton", (answer as TownLessonResult.Answered).town.name)
    }

    @Test
    fun `answers the town a stopped lesson returns`() = runTest {
        api.enqueue(json(200, TOWN))

        val answer: TownLessonResult = town().stopLesson(firstLesson)

        assertEquals("Riverton", (answer as TownLessonResult.Answered).town.name)
    }

    @Test
    fun `carries the cap and the words in learning of a refused lesson`() = runTest {
        api.enqueue(
            json(409, """{"kind":"LearningCapReached","params":{"learningCap":10,"cardsInLearning":8}}"""),
        )

        assertEquals(
            TownLessonResult.Refused(TownLessonRefusal.LearningCapReached(cap = 10, inLearning = 8)),
            town().startLesson(firstLesson),
        )
    }

    @Test
    fun `reads each bare refusal of a lesson`() = runTest {
        val refusals: Map<String, TownLessonRefusal> = mapOf(
            "StudySlotBusy" to TownLessonRefusal.StudySlotBusy,
            "LessonSchoolTooLow" to TownLessonRefusal.LessonSchoolTooLow,
            "LessonAlreadyStudied" to TownLessonRefusal.LessonAlreadyStudied,
            "LessonUnderStudy" to TownLessonRefusal.LessonUnderStudy,
            "LessonStudyNotFound" to TownLessonRefusal.LessonStudyNotFound,
            "TownNotFound" to TownLessonRefusal.TownNotFound,
        )
        val answers: Map<String, TownLessonResult> = refusals.keys.associateWith { kind: String ->
            api.enqueue(json(409, """{"kind":"$kind"}"""))
            town().startLesson(firstLesson)
        }

        assertEquals(refusals.mapValues { (_, refusal) -> TownLessonResult.Refused(refusal) }, answers)
    }

    @Test
    fun `answers an unknown refusal of a lesson as unrecognized`() = runTest {
        api.enqueue(json(409, """{"kind":"QueueFull"}"""))

        assertEquals(TownLessonResult.Refused(TownLessonRefusal.Unrecognized), town().stopLesson(firstLesson))
    }

    @Test
    fun `answers a refusal with other params as unrecognized`() = runTest {
        api.enqueue(json(409, """{"kind":"WaitingListFull","params":{"cap":2}}"""))

        assertEquals(TownLessonResult.Refused(TownLessonRefusal.Unrecognized), town().startLesson(firstLesson))
    }

    @Test
    fun `answers unreachable when a lesson gets an empty refusal`() = runTest {
        api.enqueue(MockResponse.Builder().code(404).build())

        assertEquals(TownLessonResult.Unreachable, town().startLesson(firstLesson))
    }

    @Test
    fun `answers unreachable when a lesson gets a malformed town`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""label":"town"""", """"label":"village"""")))

        assertEquals(TownLessonResult.Unreachable, town().stopLesson(firstLesson))
    }

    @Test
    fun `answers unreachable when a lesson cannot reach the api`() = runTest {
        api.close()

        assertEquals(TownLessonResult.Unreachable, town().startLesson(firstLesson))
    }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") },
        sessionEnds = SessionEnds(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val UNKNOWN_SKILL: String = """"resource":"oil","ratePercent":5,"earnedAt""""
        const val NOTHING: String = """{"money":0,"food":0,"power":0,"material":0}"""
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val LESSON: String =
            """{"id":"lesson-1","theme":"A day in town","durationSeconds":150,"requiredSchoolLevel":2,""" +
                """"skill":{"resource":"food","ratePercent":5},"isStudied":true,""" +
                """"words":[{"wordId":"word-1","isRetained":false},{"wordId":"word-2","isRetained":true}]}"""
        const val SKILL: String =
            """{"lessonId":"lesson-1","resource":"food","ratePercent":5,"earnedAt":"2026-11-04T10:00:00.000Z"}"""
        const val TOWN: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":1,"site":1},"terrain":"fields",""" +
                """"season":null,"stocks":{"money":$STOCK,"food":$STOCK,"power":$STOCK,"material":$STOCK},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":$FLAT,"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":$FLAT},""" +
                """"work":{"slot":null,"waitingList":[],"cap":2},""" +
                """"lessons":[$LESSON],"skills":[$SKILL],""" +
                """"lessonSlot":{"lessonId":"lesson-1","startedAt":"2026-11-05T10:00:00.000Z",""" +
                """"finishesAt":"2026-11-05T10:20:00.000Z"},""" +
                """"learning":{"cap":10,"inLearning":8},"readAt":"2026-11-05T10:05:00.000Z"}"""
    }
}
