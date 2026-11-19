package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeStudyAnswerSink
import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.StudyAnswer
import com.emm.mygame.core.testing.TestClock
import java.io.File
import java.util.concurrent.CountDownLatch
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
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

class StudyAnswersTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val sink: FakeStudyAnswerSink = FakeStudyAnswerSink()

    private val store: TokenStore by lazy {
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }
    }

    private var answers: StudyAnswers? = null

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `every town answer reaches the reminder`() = runTest {
        repeat(TOWN_ROUTES) { api.enqueue(json(200, TOWN)) }
        val towns: TownRepository = town()
        val target = JobTarget(area = 3, site = 5)
        val team: Map<TownHireKind, Int> = mapOf(TownHireKind.Worker to 2)

        val answered: List<TownSnapshot?> = listOf(
            (towns.read() as? TownReadResult.Read)?.town,
            (towns.found("Riverton") as? TownFoundResult.Founded)?.town,
            (towns.startWork(TownBuildingKind.Farm) as? TownWorkResult.Answered)?.town,
            (towns.stopWork(TownBuildingKind.Farm, level = 2) as? TownWorkResult.Answered)?.town,
            (towns.startLesson(LessonId("lesson-1")) as? TownLessonResult.Answered)?.town,
            (towns.stopLesson(LessonId("lesson-1")) as? TownLessonResult.Answered)?.town,
            (towns.placeHiring(TownHireKind.Worker, count = 2) as? TownHiringResult.Answered)?.town,
            (towns.stopHiring(TownHireKind.Worker, HIRING_STARTED_AT) as? TownHiringResult.Answered)?.town,
            (towns.sendJob(target, team, hours = 2) as? TownJobResult.Answered)?.town,
            (towns.sendCleanUp(target, team) as? TownJobResult.Answered)?.town,
            (towns.callJobBack(HIRING_STARTED_AT) as? TownJobResult.Answered)?.town,
        )

        assertEquals(answered.map { town: TownSnapshot? -> town?.let(::freshTown) }, sink.answers)
    }

    @Test
    fun `a 204 feeds nothing`() = runTest {
        repeat(2) { api.enqueue(MockResponse.Builder().code(204).build()) }
        val towns: TownRepository = town()

        towns.markTipSeen(TipKind.People)
        towns.dismissGuidance()

        assertEquals(emptyList<StudyAnswer>(), sink.answers)
    }

    @Test
    fun `a town answer carries its due holdout checks`() = runTest {
        api.enqueue(json(200, TOWN.replace(NO_DUE_CHECK, ONE_DUE_CHECK)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(TownSnapshot.DueHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)),
            read.dueHoldoutChecks,
        )
    }

    @Test
    fun `a reviews answer reaches the reminder`() = runTest {
        api.enqueue(json(200, NOTHING_DUE))

        val read: DueReviews = (learning().reviews() as ReviewsReadResult.Read).reviews

        assertEquals(listOf(StudyAnswer.Reviews(read)), sink.answers)
    }

    @Test
    fun `the Report answer waits from the instant it arrived`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val reportAnswer: CountDownLatch = held.holding(REPORT_PATH, json(200, REPORT))
        api.dispatcher = held
        val reports: ReportRepository = reports()

        val reading: Deferred<ReportReadResult> = async(start = CoroutineStart.UNDISPATCHED) { reports.read() }
        api.takeRequestWithin()
        delay(90.seconds)
        reportAnswer.countDown()
        val read: TownReport = (reading.await() as ReportReadResult.Read).report

        assertEquals(listOf(StudyAnswer.Report(read, Instant.parse("2026-11-05T10:01:30Z"))), sink.answers)
    }

    @Test
    fun `a holdout checks read reaches the reminder`() = runTest {
        api.enqueue(json(200, checks(DUE_CHECK)))

        holdoutChecks().read()

        assertEquals(
            listOf(StudyAnswer.HoldoutChecks(listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)))),
            sink.answers,
        )
    }

    @Test
    fun `a holdout check change feeds check due`() = runTest {
        api.enqueue(json(200, checks(DUE_CHECK)))

        holdoutChecks().skip(PlacementBand.Second, HoldoutCheckWeek.Eighth)

        assertEquals(
            listOf(StudyAnswer.HoldoutChecks(listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)))),
            sink.answers,
        )
    }

    @Test
    fun `a refusal or an outage feeds nothing`() = runTest {
        api.enqueue(json(409, "{}"))
        api.enqueue(json(500, "{}"))
        api.enqueue(json(503, "{}"))
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))
        api.enqueue(json(409, """{"kind":"WaitingListFull","params":{"cap":2}}"""))

        holdoutChecks().begin(PlacementBand.First, HoldoutCheckWeek.Eighth)
        learning().reviews()
        reports().read()
        town().read()
        town().startWork(TownBuildingKind.Farm)
        api.close()
        holdoutChecks().read()

        assertEquals(emptyList<StudyAnswer>(), sink.answers)
    }

    @Test
    fun `a session change reaches the reminder`() = runTest {
        town()

        store.write("next-session")

        assertEquals(listOf(StudyAnswer.SessionChanged), sink.answers)
    }

    @Test
    fun `drops an answer whose read started before the session changed`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val reviewsAnswer: CountDownLatch = held.holding(REVIEWS_PATH, json(200, NOTHING_DUE))
        api.dispatcher = held
        val learning: LearningRepository = learning()

        val read: Deferred<ReviewsReadResult> = async(start = CoroutineStart.UNDISPATCHED) { learning.reviews() }
        api.takeRequestWithin()
        store.write("next-session")
        reviewsAnswer.countDown()
        read.await()

        assertEquals(listOf(StudyAnswer.SessionChanged), sink.answers)
    }

    @Test
    fun `a town answer older than the last holdout checks answer leaves check due to it`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN.replace(NO_DUE_CHECK, ONE_DUE_CHECK)))
        held.answering(CHECKS_PATH, json(200, checks()))
        api.dispatcher = held
        val towns: TownRepository = town()

        val staleRead: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        holdoutChecks().read()
        townAnswer.countDown()
        val town: TownSnapshot = (staleRead.await() as TownReadResult.Read).town

        val checkLeft = TownAnswerFreshness(areCardsFresh = true, isCheckFresh = false)
        assertEquals(listOf(StudyAnswer.HoldoutChecks(emptyList()), StudyAnswer.Town(town, checkLeft)), sink.answers)
    }

    @Test
    fun `drops a holdout checks answer older than the last town answer`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val checksAnswer: CountDownLatch = held.holding(CHECKS_PATH, json(200, checks(DUE_CHECK)))
        held.answering(TOWN_PATH, json(200, TOWN))
        api.dispatcher = held
        val checks: HoldoutCheckRepository = holdoutChecks()

        val staleRead: Deferred<HoldoutChecksReadResult> =
            async(start = CoroutineStart.UNDISPATCHED) { checks.read() }
        api.takeRequestWithin()
        val town: TownSnapshot = (town().read() as TownReadResult.Read).town
        checksAnswer.countDown()
        staleRead.await()

        assertEquals(listOf(freshTown(town)), sink.answers)
    }

    @Test
    fun `a town answer older than the last reviews answer leaves the cards to it`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        held.answering(REVIEWS_PATH, json(200, NOTHING_DUE))
        api.dispatcher = held
        val towns: TownRepository = town()

        val staleRead: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val reviews: DueReviews = (learning().reviews() as ReviewsReadResult.Read).reviews
        townAnswer.countDown()
        val town: TownSnapshot = (staleRead.await() as TownReadResult.Read).town

        val cardsLeft = TownAnswerFreshness(areCardsFresh = false, isCheckFresh = true)
        assertEquals(listOf(StudyAnswer.Reviews(reviews), StudyAnswer.Town(town, cardsLeft)), sink.answers)
    }

    @Test
    fun `drops a reviews answer older than the last town answer`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val reviewsAnswer: CountDownLatch = held.holding(REVIEWS_PATH, json(200, NOTHING_DUE))
        held.answering(TOWN_PATH, json(200, TOWN))
        api.dispatcher = held
        val learning: LearningRepository = learning()

        val staleRead: Deferred<ReviewsReadResult> = async(start = CoroutineStart.UNDISPATCHED) { learning.reviews() }
        api.takeRequestWithin()
        val town: TownSnapshot = (town().read() as TownReadResult.Read).town
        reviewsAnswer.countDown()
        staleRead.await()

        assertEquals(listOf(freshTown(town)), sink.answers)
    }

    @Test
    fun `drops a Report answer older than the last town answer`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val reportAnswer: CountDownLatch = held.holding(REPORT_PATH, json(200, REPORT))
        held.answering(TOWN_PATH, json(200, TOWN))
        api.dispatcher = held
        val reports: ReportRepository = reports()

        val staleRead: Deferred<ReportReadResult> = async(start = CoroutineStart.UNDISPATCHED) { reports.read() }
        api.takeRequestWithin()
        val town: TownSnapshot = (town().read() as TownReadResult.Read).town
        reportAnswer.countDown()
        staleRead.await()

        assertEquals(listOf(freshTown(town)), sink.answers)
    }

    @Test
    fun `keeps a reviews answer sent after a town read that answered first`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val reviewsAnswer: CountDownLatch = held.holding(REVIEWS_PATH, json(200, NOTHING_DUE))
        api.dispatcher = held
        val towns: TownRepository = town()
        val learning: LearningRepository = learning()

        val townRead: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val reviewsRead: Deferred<ReviewsReadResult> =
            async(start = CoroutineStart.UNDISPATCHED) { learning.reviews() }
        api.takeRequestWithin()
        townAnswer.countDown()
        val town: TownSnapshot = (townRead.await() as TownReadResult.Read).town
        reviewsAnswer.countDown()
        val reviews: DueReviews = (reviewsRead.await() as ReviewsReadResult.Read).reviews

        assertEquals(listOf(freshTown(town), StudyAnswer.Reviews(reviews)), sink.answers)
    }

    @Test
    fun `a town read after a reviews answer gets an answer sent after it, never the read already out`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        held.answering(REVIEWS_PATH, json(200, NOTHING_DUE))
        api.dispatcher = held
        val towns: TownRepository = town()

        val readOut: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        learning().reviews()
        val readAfter: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        townAnswer.countDown()
        readOut.await()
        val town: TownSnapshot = (readAfter.await() as TownReadResult.Read).town

        assertEquals(freshTown(town), sink.answers.last())
    }

    @Test
    fun `drops a town answer older than the last town answer`() = runTest {
        val held: HeldAnswers = HeldAnswers()
        val readAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        held.answering(WORK_PATH, json(200, TOWN))
        api.dispatcher = held
        val towns: TownRepository = town()

        val staleRead: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val worked: TownSnapshot = (towns.startWork(TownBuildingKind.Farm) as TownWorkResult.Answered).town
        readAnswer.countDown()
        staleRead.await()

        assertEquals(listOf(freshTown(worked)), sink.answers)
    }

    @Test
    fun `keeps a town answer whose read started after the last holdout checks answer`() = runTest {
        api.enqueue(json(200, checks()))
        api.enqueue(json(200, TOWN))

        holdoutChecks().read()
        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(listOf(StudyAnswer.HoldoutChecks(emptyList()), freshTown(read)), sink.answers)
    }

    private fun freshTown(town: TownSnapshot): StudyAnswer =
        StudyAnswer.Town(town, TownAnswerFreshness(areCardsFresh = true, isCheckFresh = true))

    private fun TestScope.studyAnswers(): StudyAnswers = answers ?: StudyAnswers(
        store,
        sink,
        TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")),
    ).also { created: StudyAnswers -> answers = created }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        languages = PlayerLanguages(store, onNamed = {}),
        sessionEnds = SessionEnds(),
        studyAnswers = studyAnswers(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")),
    )

    private fun TestScope.learning(): LearningRepository = LearningRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        sessionEnds = SessionEnds(),
        studyAnswers = studyAnswers(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun TestScope.reports(): ReportRepository = ReportRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        sessionEnds = SessionEnds(),
        studyAnswers = studyAnswers(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun TestScope.holdoutChecks(): HoldoutCheckRepository = HoldoutCheckRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        sessionEnds = SessionEnds(),
        studyAnswers = studyAnswers(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private fun checks(vararg states: String): String = """{"checks":[${states.joinToString(",")}]}"""

    private companion object {
        const val TOWN_ROUTES: Int = 11
        const val TOWN_PATH: String = "/api/town"
        const val REVIEWS_PATH: String = "/api/reviews"
        const val REPORT_PATH: String = "/api/report"
        const val WORK_PATH: String = "/api/town/work"
        const val CHECKS_PATH: String = "/api/holdout-checks"
        val HIRING_STARTED_AT: Instant = Instant.parse("2026-11-05T09:00:00Z")
        const val DUE_CHECK: String = """{"kind":"due","band":1,"week":8}"""
        const val NO_DUE_CHECK: String = """"dueHoldoutChecks":[]"""
        const val ONE_DUE_CHECK: String = """"dueHoldoutChecks":[{"band":1,"week":8}]"""
        const val NOTHING_DUE: String =
            """{"due":[],"readFirst":[],"nextDueAt":"2026-11-10T09:10:00.000Z","readAt":"2026-11-10T09:04:00.000Z"}"""
        const val REPORT: String =
            """{"dueCount":0,"due":[],"readFirst":[],"nextDueAt":"2026-11-07T08:00:00.000Z","news":[]}"""
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000,"fullAt":null}"""
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
                """"lessons":[],"releasedLessons":[],"dueHoldoutChecks":[],""" +
                """"hasBandStarted":false,"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"stableWordCount":0,"retainedWordCount":0,""" +
                """"nextStep":{"kind":"caughtUp","reason":"lessonsDone","goal":null},"tip":null,""" +
                """"chromePhase":"scaffold","scaffold":"es","scaffoldVersion":0,"nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""
    }
}
