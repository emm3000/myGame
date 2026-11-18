package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import java.util.concurrent.CountDownLatch
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
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
    fun `a read after a session change never joins the read of the session before`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        val towns: TownRepository = town()

        val before: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        store.write("another-session")
        val after: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        townAnswer.countDown()
        before.await()
        after.await()

        assertEquals("Bearer another-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `a read after a sign-out never joins the read of the session before`() = runTest {
        val townAnswer: CountDownLatch = held.holding(TOWN_PATH, json(200, TOWN))
        held.answering(SIGN_OUT_PATH, MockResponse.Builder().code(204).build())
        val towns: TownRepository = town()

        val before: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        api.takeRequestWithin()
        sessions().signOut()
        api.takeRequestWithin()
        val after: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { towns.read() }
        townAnswer.countDown()
        before.await()
        after.await()

        assertEquals(null, api.takeRequestWithin().headers["Authorization"])
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

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val TOWN_PATH: String = "/api/town"
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
                """"lessons":[],"releasedLessons":[],"dueHoldoutChecks":[],""" +
                """"hasBandStarted":false,"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"stableWordCount":0,"retainedWordCount":0,""" +
                """"nextStep":{"kind":"caughtUp","goal":null},"tip":null,""" +
                """"chromePhase":"scaffold","scaffold":"es","scaffoldVersion":0,"nextDueAt":null,""" +
                """"readAt":"2026-11-13T10:00:00.000Z"}"""
    }
}
