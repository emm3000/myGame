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
    fun `reads the due reviews from the player's reviews`() = runTest {
        api.enqueue(json(200, NO_REVIEWS))

        learning().reviews()

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("GET /api/reviews", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `answers the due reviews in the order the api answers them`() = runTest {
        api.enqueue(json(200, TWO_DUE))

        assertEquals(
            ReviewsReadResult.Read(
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
                    readAt = Instant.parse("2026-11-10T08:59:30Z"),
                ),
            ),
            learning().reviews(),
        )
    }

    @Test
    fun `paces the next review on the server's read instant`() = runTest {
        api.enqueue(json(200, NOTHING_DUE))

        val read: ReviewsReadResult = learning().reviews()

        assertEquals(Instant.parse("2026-11-10T09:04:00.000Z"), (read as ReviewsReadResult.Read).reviews.readAt)
    }

    @Test
    fun `answers unreachable when the reviews cannot reach the api`() = runTest {
        api.close()

        assertEquals(ReviewsReadResult.Unreachable, learning().reviews())
    }

    @Test
    fun `posts the hint of the word it names on the player's reviews`() = runTest {
        api.enqueue(json(200, """{"firstLetter":"s","letterCount":6}"""))

        learning().hint(WordId("lesson-1-2"))

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/reviews/lesson-1-2/hint", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `answers the first letter and the letter count of the hint`() = runTest {
        api.enqueue(json(200, """{"firstLetter":"s","letterCount":6}"""))

        assertEquals(
            ReviewHintResult.Hinted(ReviewHint(firstLetter = "s", letterCount = 6)),
            learning().hint(WordId("lesson-1-2")),
        )
    }

    @Test
    fun `answers the hint refusal the api names`() = runTest {
        api.enqueue(refused("HintOnRecognition"))

        assertEquals(
            ReviewHintResult.Refused(ReviewRefusal.HintOnRecognition),
            learning().hint(WordId("lesson-1-2")),
        )
    }

    @Test
    fun `sends the answer exactly as typed on the player's reviews`() = runTest {
        api.enqueue(json(200, answerOf(NEAR_MISS)))

        learning().answer(WordId("lesson-1-2"), "  School ")

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/reviews/lesson-1-2/answer", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"answer":"  School "}""", request.body?.utf8())
    }

    @Test
    fun `answers a near-miss`() = runTest {
        api.enqueue(json(200, answerOf(NEAR_MISS)))

        val result: ReviewAnswerResult = learning().answer(WordId("lesson-1-2"), "scool")

        assertEquals(ReviewVerdict.NearMiss, (result as ReviewAnswerResult.Answered).verdict)
    }

    @Test
    fun `answers a correct verdict with the skill it earned at the level the api answers`() = runTest {
        api.enqueue(json(200, answerOf(CORRECT_WITH_SKILL)))

        val result: ReviewAnswerResult = learning().answer(WordId("lesson-1-2"), "school")

        assertEquals(
            ReviewVerdict.Correct(
                word = "school",
                gloss = "escuela",
                dueAt = Instant.parse("2026-11-12T09:10:00.000Z"),
                earnedSkill = RaisedSkill(
                    resource = TownResourceKind.Food,
                    level = 2,
                    ratePercent = 5,
                    ratePerHourBefore = 18.75,
                    ratePerHourAfter = 19.6875,
                ),
            ),
            (result as ReviewAnswerResult.Answered).verdict,
        )
    }

    @Test
    fun `answers the earned skill with no rates while the player holds no town`() = runTest {
        api.enqueue(json(200, answerOf(CORRECT_WITHOUT_TOWN)))

        val result: ReviewAnswerResult = learning().answer(WordId("lesson-1-2"), "school")

        assertEquals(
            RaisedSkill(
                resource = TownResourceKind.Power,
                level = 1,
                ratePercent = 5,
                ratePerHourBefore = null,
                ratePerHourAfter = null,
            ),
            ((result as ReviewAnswerResult.Answered).verdict as ReviewVerdict.Correct).earnedSkill,
        )
    }

    @Test
    fun `answers a correct verdict without the earned skill whose resource the client does not know`() = runTest {
        api.enqueue(json(200, answerOf(CORRECT_WITH_SKILL.replace("food", "silk"))))

        val result: ReviewAnswerResult = learning().answer(WordId("lesson-1-2"), "school")

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

        val result: ReviewAnswerResult = learning().answer(WordId("lesson-1-1"), "house")

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
            learning().answer(WordId("lesson-1-2"), "school")
        }

        assertEquals(refusals.values.map { refusal: ReviewRefusal -> ReviewAnswerResult.Refused(refusal) }, answered)
    }

    @Test
    fun `answers unreachable when the answer cannot reach the api`() = runTest {
        api.close()

        assertEquals(
            ReviewAnswerResult.Unreachable,
            learning().answer(WordId("lesson-1-2"), "school"),
        )
    }

    private fun TestScope.learning(): LearningRepository = LearningRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = signedIn(),
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun signedIn(): TokenStore =
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }

    private fun answerOf(verdict: String): String = """{"verdict":$verdict}"""

    private fun reviews(body: String): MockResponse = json(200, body)

    private fun refused(kind: String): MockResponse = json(409, """{"kind":"$kind"}""")

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val NO_REVIEWS: String = """{"due":[],"nextDueAt":null,"readAt":"2026-11-10T08:59:30.000Z"}"""
        const val NOTHING_DUE: String =
            """{"due":[],"nextDueAt":"2026-11-10T09:10:00.000Z","readAt":"2026-11-10T09:04:00.000Z"}"""
        const val TWO_DUE: String =
            """{"due":[""" +
                """{"mode":"recognition","wordId":"lesson-1-2","lessonId":"lesson-1",""" +
                """"dueAt":"2026-11-10T09:00:00.000Z","word":"school","frame":"The kids walk to school.",""" +
                """"choices":[{"choiceId":"0a1b2c3d","gloss":"escuela"},{"choiceId":"4e5f6a7b","gloss":"comida"}]},""" +
                """{"mode":"recall","wordId":"lesson-1-1","lessonId":"lesson-1",""" +
                """"dueAt":"2026-11-10T09:01:00.000Z","gloss":"casa","gappedFrame":"She goes ___ at six."}""" +
                """],"nextDueAt":"2026-11-10T09:10:00.000Z","readAt":"2026-11-10T08:59:30.000Z"}"""
        const val NEAR_MISS: String = """{"kind":"nearMiss"}"""
        const val CORRECT_WITH_SKILL: String =
            """{"kind":"correct","word":"school","gloss":"escuela","dueAt":"2026-11-12T09:10:00.000Z",""" +
                """"earnedSkill":{"lessonId":"lesson-1","resource":"food","ratePercent":5,""" +
                """"earnedAt":"2026-11-23T09:10:00.000Z","level":2,""" +
                """"ratePerHourBefore":18.75,"ratePerHourAfter":19.6875}}"""
        const val CORRECT_WITHOUT_TOWN: String =
            """{"kind":"correct","word":"school","gloss":"escuela","dueAt":"2026-11-12T09:10:00.000Z",""" +
                """"earnedSkill":{"lessonId":"lesson-1","resource":"power","ratePercent":5,""" +
                """"earnedAt":"2026-11-23T09:10:00.000Z","level":1,""" +
                """"ratePerHourBefore":null,"ratePerHourAfter":null}}"""
        const val WRONG: String =
            """{"kind":"wrong","word":"home","gloss":"casa","dueAt":"2026-11-10T09:11:00.000Z"}"""
    }
}
