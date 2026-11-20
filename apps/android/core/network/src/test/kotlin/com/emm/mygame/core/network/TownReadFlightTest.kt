package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TownReadFlightTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val held: HeldAnswers = HeldAnswers()

    private val store: TokenStore by lazy {
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }
    }

    @Before
    fun startApi() {
        api.dispatcher = held
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `a read that comes while another is out sends no second request`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town()

        val first: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val joined: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        townAnswer.countDown()
        first.await()
        joined.await()

        assertEquals(1, api.requestCount)
    }

    @Test
    fun `a read sent after now never joins the read already out`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town()

        val readOut: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val sentAfter: Deferred<TownReadResult> =
            async(start = CoroutineStart.UNDISPATCHED) { towns.readSentAfterNow() }
        townAnswer.countDown()
        readOut.await()
        sentAfter.await()

        assertEquals(2, api.requestCount)
    }

    @Test
    fun `a joined read still gets its answer when the read that sent the request is cancelled`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town()

        val cancelled: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        val joined: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        cancelled.cancel()
        townAnswer.countDown()

        assertEquals("Riverton", (joined.await() as TownReadResult.Read).town.name)
    }

    @Test
    fun `a read that comes after the answer sends a new request`() = runTest {
        held.answering(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town()
        towns.read()

        towns.read()

        assertEquals(2, api.requestCount)
    }

    @Test
    fun `a read after a session change never hands it the town of the session before`() = runTest {
        val sessionBefore: SessionTowns = SessionTowns(beforeBearer = "Bearer opaque-session")
        api.dispatcher = sessionBefore
        val towns: TownRepository = town()

        val before: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        store.write("another-session")
        val after: TownReadResult = towns.read()
        sessionBefore.answer.countDown()
        before.await()

        assertEquals(NEXT_TOWN_NAME, (after as TownReadResult.Read).town.name)
        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    @Test
    fun `a read after a sign-out never hands it the town of the session before`() = runTest {
        val sessionBefore: SessionTowns = SessionTowns(beforeBearer = "Bearer opaque-session")
        api.dispatcher = sessionBefore
        val towns: TownRepository = town()

        val before: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        sessions().signOut()
        val after: TownReadResult = towns.read()
        sessionBefore.answer.countDown()
        before.await()

        assertEquals(NEXT_TOWN_NAME, (after as TownReadResult.Read).town.name)
        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    @Test
    fun `an older read that answers late never replaces the town of a newer read`() = runTest {
        val lateFirstRead: LateFirstRead = LateFirstRead()
        api.dispatcher = lateFirstRead
        val towns: TownRepository = town()

        val older: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        towns.readSentAfterNow()
        lateFirstRead.answer.countDown()
        older.await()

        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    @Test
    fun `an older read that answers late never replaces the town a lesson start answered`() = runTest {
        val lateFirstRead: LateFirstRead = LateFirstRead()
        api.dispatcher = lateFirstRead
        val towns: TownRepository = town()

        val older: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        towns.startLesson(LessonId("lesson-2"))
        lateFirstRead.answer.countDown()
        older.await()

        assertEquals(NEXT_TOWN_NAME, towns.town.value?.town?.name)
    }

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        languages = PlayerLanguages(store, onNamed = {}),
        sessionEnds = SessionEnds(),
        studyAnswers = discardedStudyAnswers(store),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, Instant.parse("2026-11-13T10:00:00Z")),
    )

    private fun TestScope.sessions(): SessionRepository = SessionRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        languages = PlayerLanguages(store, onNamed = {}),
        sessionEnds = SessionEnds(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private class SessionTowns(private val beforeBearer: String) : Dispatcher() {
        val answer: CountDownLatch = CountDownLatch(1)

        override fun dispatch(request: RecordedRequest): MockResponse {
            if (request.url.encodedPath == SIGN_OUT_PATH) return MockResponse.Builder().code(204).build()
            if (request.headers["Authorization"] != beforeBearer) return json(200, NEXT_TOWN)
            answer.await(ANSWER_WAIT_SECONDS, TimeUnit.SECONDS)
            return json(200, TOWN)
        }
    }

    private class LateFirstRead : Dispatcher() {
        val answer: CountDownLatch = CountDownLatch(1)

        private val isFirstRead: AtomicBoolean = AtomicBoolean(true)

        override fun dispatch(request: RecordedRequest): MockResponse {
            val isLateRead: Boolean = request.method == "GET" && isFirstRead.getAndSet(false)
            if (!isLateRead) return json(200, NEXT_TOWN)
            answer.await(ANSWER_WAIT_SECONDS, TimeUnit.SECONDS)
            return json(200, TOWN)
        }
    }

    private companion object {
        const val TOWN_PATH: String = "/api/town"
        const val NEXT_TOWN_NAME: String = "Maple Falls"
        val NEXT_TOWN: String = TOWN.replace("Riverton", NEXT_TOWN_NAME)
        const val ANSWER_WAIT_SECONDS: Long = 5L
        const val SIGN_OUT_PATH: String = "/api/auth/sign-out"
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
                """"lessons":[],"releasedLessons":[],"texts":[],"dueHoldoutChecks":[],""" +
                """"hasBandStarted":false,"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null,"nextInLearningDueAt":null},""" +
                """"stableWordCount":0,"retainedWordCount":0,""" +
                """"nextStep":{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":null},"tip":null,""" +
                """"chromePhase":"scaffold","scaffold":"es","scaffoldVersion":0,"nextDueAt":null,""" +
                """"readAt":"2026-11-13T10:00:00.000Z"}"""
    }
}

private fun json(code: Int, body: String): MockResponse =
    MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()
