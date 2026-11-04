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

class LearningRepositoryTest {

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
    fun `reads a lesson in the study slot with its finish`() = runTest {
        api.enqueue(json(200, idleOverview().replace(IDLE_STUDY, LESSON_UNDER_STUDY)))

        assertEquals(
            StudySlot.Lesson(lesson = LessonId("lesson-1"), finishesAt = Instant.parse("2026-11-10T09:00:00.000Z")),
            readFief().study,
        )
    }

    @Test
    fun `reads each lesson with its theme, whether it is studied and its count of words`() = runTest {
        api.enqueue(json(200, idleOverview().replace(NO_LESSONS, LESSON_ONE)))

        assertEquals(
            listOf(LessonState(id = LessonId("lesson-1"), theme = "A day in town", isStudied = true, wordCount = 2)),
            readFief().lessons,
        )
    }

    @Test
    fun `reads the skills the player earned`() = runTest {
        api.enqueue(json(200, idleOverview().replace(NO_SKILLS, FOOD_SKILL)))

        assertEquals(
            listOf(EarnedSkill(lesson = LessonId("lesson-1"), resource = ResourceKind.Food, ratePercent = 5)),
            readFief().skills,
        )
    }

    @Test
    fun `reads the due reviews in the order the api answers them`() = runTest {
        api.enqueue(json(200, idleOverview().replace(NO_REVIEWS, TWO_DUE)))

        assertEquals(
            DueReviews(
                due = listOf(
                    DueReview.Recognition(
                        wordId = WordId("lesson-1-2"),
                        lesson = LessonId("lesson-1"),
                        dueAt = Instant.parse("2026-11-10T09:00:00.000Z"),
                        word = "school",
                        frame = "The kids walk to school.",
                        choices = listOf(
                            ReviewChoice(id = ChoiceId("0a1b2c3d"), gloss = "escuela"),
                            ReviewChoice(id = ChoiceId("4e5f6a7b"), gloss = "comida"),
                        ),
                    ),
                    DueReview.Recall(
                        wordId = WordId("lesson-1-1"),
                        lesson = LessonId("lesson-1"),
                        dueAt = Instant.parse("2026-11-10T09:01:00.000Z"),
                        gloss = "casa",
                        gappedFrame = "She goes ___ at six.",
                    ),
                ),
                nextDueAt = Instant.parse("2026-11-10T09:10:00.000Z"),
            ),
            readFief().reviews,
        )
    }

    @Test
    fun `drops a skill whose resource the client does not know`() = runTest {
        api.enqueue(json(200, idleOverview().replace(NO_SKILLS, FOOD_SKILL.replace("food", "silk"))))

        assertEquals(emptyList<EarnedSkill>(), readFief().skills)
    }

    @Test
    fun `posts the start of the lesson it names`() = runTest {
        api.enqueue(json(200, idleOverview()))

        learning().startLesson(FiefId(LISTED_FIEF_ID), LessonId("lesson-1"))

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/fiefs/$LISTED_FIEF_ID/lessons", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"lessonId":"lesson-1"}""", request.body?.utf8())
    }

    @Test
    fun `deletes the study of the lesson it names`() = runTest {
        api.enqueue(json(200, idleOverview()))

        learning().cancelLesson(FiefId(LISTED_FIEF_ID), LessonId("lesson-1"))

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals(
            "DELETE /api/fiefs/$LISTED_FIEF_ID/lessons/lesson-1",
            "${request.method} ${request.url.encodedPath}",
        )
    }

    @Test
    fun `answers the overview the lesson start returns`() = runTest {
        api.enqueue(json(200, idleOverview().replace(IDLE_STUDY, LESSON_UNDER_STUDY)))

        val result: StudyResult = learning().startLesson(FiefId(LISTED_FIEF_ID), LessonId("lesson-1"))

        assertEquals(LessonId("lesson-1"), ((result as StudyResult.Answered).fief.study as StudySlot.Lesson).lesson)
    }

    @Test
    fun `answers the lesson refusal the api names`() = runTest {
        val refusals: Map<String, StudyRefusal> = mapOf(
            "StudySlotBusy" to StudyRefusal.StudySlotBusy,
            "LessonLibraryTooLow" to StudyRefusal.LessonLibraryTooLow,
            "LessonAlreadyStudied" to StudyRefusal.LessonAlreadyStudied,
            "LessonUnderStudy" to StudyRefusal.LessonUnderStudy,
            "LessonStudyNotFound" to StudyRefusal.LessonStudyNotFound,
        )
        refusals.keys.forEach { kind: String -> api.enqueue(refused(kind)) }

        val answered: List<StudyResult> = refusals.keys.map {
            learning().startLesson(FiefId(LISTED_FIEF_ID), LessonId("lesson-1"))
        }

        assertEquals(refusals.values.map { refusal: StudyRefusal -> StudyResult.Refused(refusal) }, answered)
    }

    @Test
    fun `posts the hint of the word it names`() = runTest {
        api.enqueue(json(200, """{"firstLetter":"s","letterCount":6}"""))

        learning().hint(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"))

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals(
            "POST /api/fiefs/$LISTED_FIEF_ID/reviews/lesson-1-2/hint",
            "${request.method} ${request.url.encodedPath}",
        )
    }

    @Test
    fun `answers the first letter and the letter count of the hint`() = runTest {
        api.enqueue(json(200, """{"firstLetter":"s","letterCount":6}"""))

        assertEquals(
            ReviewHintResult.Hinted(ReviewHint(firstLetter = "s", letterCount = 6)),
            learning().hint(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2")),
        )
    }

    @Test
    fun `answers the hint refusal the api names`() = runTest {
        api.enqueue(refused("HintOnRecognition"))

        assertEquals(
            ReviewHintResult.Refused(ReviewRefusal.HintOnRecognition),
            learning().hint(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2")),
        )
    }

    @Test
    fun `sends the answer exactly as typed`() = runTest {
        api.enqueue(json(200, answerOf(NEAR_MISS)))

        learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"), "  School ")

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals(
            "POST /api/fiefs/$LISTED_FIEF_ID/reviews/lesson-1-2/answer",
            "${request.method} ${request.url.encodedPath}",
        )
        assertEquals("""{"answer":"  School "}""", request.body?.utf8())
    }

    @Test
    fun `answers a near-miss with the fief the answer carried`() = runTest {
        api.enqueue(json(200, answerOf(NEAR_MISS)))

        val result: ReviewAnswerResult = learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"), "scool")

        assertEquals(ReviewVerdict.NearMiss, (result as ReviewAnswerResult.Answered).verdict)
    }

    @Test
    fun `answers a correct verdict with the skill it earned at the level the api answers`() = runTest {
        api.enqueue(json(200, answerOf(CORRECT_WITH_SKILL)))

        val result: ReviewAnswerResult = learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"), "school")

        assertEquals(
            ReviewVerdict.Correct(
                word = "school",
                gloss = "escuela",
                dueAt = Instant.parse("2026-11-12T09:10:00.000Z"),
                earnedSkill = RaisedSkill(resource = ResourceKind.Food, level = 2, ratePercent = 5),
            ),
            (result as ReviewAnswerResult.Answered).verdict,
        )
    }

    @Test
    fun `answers a correct verdict without the earned skill whose resource the client does not know`() = runTest {
        api.enqueue(json(200, answerOf(CORRECT_WITH_SKILL.replace("food", "silk"))))

        val result: ReviewAnswerResult = learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"), "school")

        assertEquals(
            ReviewVerdict.Correct(
                word = "school",
                gloss = "escuela",
                dueAt = Instant.parse("2026-11-12T09:10:00.000Z"),
                earnedSkill = null,
            ),
            (result as ReviewAnswerResult.Answered).verdict,
        )
    }

    @Test
    fun `answers a wrong verdict with the correct form`() = runTest {
        api.enqueue(json(200, answerOf(WRONG)))

        val result: ReviewAnswerResult = learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-1"), "house")

        assertEquals(
            ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = Instant.parse("2026-11-10T09:11:00.000Z")),
            (result as ReviewAnswerResult.Answered).verdict,
        )
    }

    @Test
    fun `answers the review refusal the api names`() = runTest {
        val refusals: Map<String, ReviewRefusal> = mapOf(
            "ReviewNotDue" to ReviewRefusal.ReviewNotDue,
            "UnknownChoice" to ReviewRefusal.UnknownChoice,
            "WordNotHeld" to ReviewRefusal.WordNotHeld,
            "UnknownWord" to ReviewRefusal.UnknownWord,
            "QueueFull" to ReviewRefusal.Unrecognized,
        )
        refusals.keys.forEach { kind: String -> api.enqueue(refused(kind)) }

        val answered: List<ReviewAnswerResult> = refusals.keys.map {
            learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"), "school")
        }

        assertEquals(refusals.values.map { refusal: ReviewRefusal -> ReviewAnswerResult.Refused(refusal) }, answered)
    }

    @Test
    fun `answers unreachable when the answer cannot reach the api`() = runTest {
        api.close()

        assertEquals(
            ReviewAnswerResult.Unreachable,
            learning().answer(FiefId(LISTED_FIEF_ID), WordId("lesson-1-2"), "school"),
        )
    }

    private suspend fun TestScope.readFief(): FiefSnapshot {
        val result: FiefReadResult = repository().read(FiefId(LISTED_FIEF_ID))
        return (result as FiefReadResult.Read).fief
    }

    private fun TestScope.repository(): FiefRepository = FiefRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = signedIn(),
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun TestScope.learning(): LearningRepository = LearningRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = signedIn(),
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun signedIn(): TokenStore =
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }

    private fun answerOf(verdict: String): String = """{"verdict":$verdict,"fief":${idleOverview()}}"""

    private fun refused(kind: String): MockResponse = json(409, """{"kind":"$kind","message":"refused"}""")

    private fun idleOverview(): String = text("fief-overview-idle.json")

    private fun text(name: String): String =
        requireNotNull(javaClass.classLoader?.getResource(name)) { "missing $name" }.readText().trim()

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val LISTED_FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
        const val IDLE_STUDY: String = """"study":{"kind":"idle"}"""
        const val LESSON_UNDER_STUDY: String =
            """"study":{"kind":"lesson","lessonId":"lesson-1",""" +
                """"startedAt":"2026-11-10T08:57:30.000Z","finishesAt":"2026-11-10T09:00:00.000Z"}"""
        const val NO_LESSONS: String = """"lessons":[]"""
        const val LESSON_ONE: String =
            """"lessons":[{"id":"lesson-1","theme":"A day in town","durationSeconds":150,""" +
                """"requiredLibraryLevel":1,"skill":{"resource":"food","ratePercent":5},"isStudied":true,""" +
                """"words":[{"wordId":"lesson-1-1","isRetained":false},{"wordId":"lesson-1-2","isRetained":true}]}]"""
        const val NO_SKILLS: String = """"skills":[]"""
        const val FOOD_SKILL: String =
            """"skills":[{"lessonId":"lesson-1","resource":"food","ratePercent":5,""" +
                """"earnedAt":"2026-11-23T09:10:00.000Z"}]"""
        const val NO_REVIEWS: String = """"reviews":{"due":[],"nextDueAt":null}"""
        const val TWO_DUE: String =
            """"reviews":{"due":[""" +
                """{"mode":"recognition","wordId":"lesson-1-2","lessonId":"lesson-1",""" +
                """"dueAt":"2026-11-10T09:00:00.000Z","word":"school","frame":"The kids walk to school.",""" +
                """"choices":[{"choiceId":"0a1b2c3d","gloss":"escuela"},{"choiceId":"4e5f6a7b","gloss":"comida"}]},""" +
                """{"mode":"recall","wordId":"lesson-1-1","lessonId":"lesson-1",""" +
                """"dueAt":"2026-11-10T09:01:00.000Z","gloss":"casa","gappedFrame":"She goes ___ at six."}""" +
                """],"nextDueAt":"2026-11-10T09:10:00.000Z"}"""
        const val NEAR_MISS: String = """{"kind":"nearMiss"}"""
        const val CORRECT_WITH_SKILL: String =
            """{"kind":"correct","word":"school","gloss":"escuela","dueAt":"2026-11-12T09:10:00.000Z",""" +
                """"earnedSkill":{"lessonId":"lesson-1","resource":"food","ratePercent":5,""" +
                """"earnedAt":"2026-11-23T09:10:00.000Z","level":2,""" +
                """"ratePerHourBefore":18.75,"ratePerHourAfter":19.6875}}"""
        const val WRONG: String =
            """{"kind":"wrong","word":"home","gloss":"casa","dueAt":"2026-11-10T09:11:00.000Z"}"""
    }
}
