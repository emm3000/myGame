package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
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
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PlayerLanguagesTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val sessionEnds: SessionEnds = SessionEnds()

    private val store: TokenStore by lazy { TokenStore(File(folder.root, "session"), FakeTokenCipher()) }

    private val languages: PlayerLanguages by lazy { PlayerLanguages(store) }

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `holds no language before the api names one`() {
        assertNull(languages.language.value)
    }

    @Test
    fun `holds the spanish scaffold and the scaffold phase a sign-in names`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "scaffold"))

        sessions().signIn("ines@sotoverde.es", "contrasena")

        assertEquals(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold), languages.language.value)
    }

    @Test
    fun `holds the none scaffold and the english phase a sign-up names`() = runTest {
        api.enqueue(session(code = 201, scaffold = "none", chromePhase = "english"))

        sessions().signUp("elena@encinar.es", "contrasena")

        assertEquals(PlayerLanguage(PlayerScaffold.None, PlayerChromePhase.English), languages.language.value)
    }

    @Test
    fun `holds the both phase a restored session names`() = runTest {
        store.write("opaque-session")
        api.enqueue(json(200, playerJson(scaffold = "es", chromePhase = "both")))

        sessions().restore()

        assertEquals(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both), languages.language.value)
    }

    @Test
    fun `draws the phase of a town read over the phase of the sign-in before it`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "scaffold"))
        api.enqueue(json(200, TOWN_READ_IN_THE_BOTH_PHASE))

        sessions().signIn("ines@sotoverde.es", "contrasena")
        town().read()

        assertEquals(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both), languages.language.value)
    }

    @Test
    fun `draws the phase of a town change`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "both"))
        api.enqueue(json(200, TOWN_READ_IN_THE_BOTH_PHASE.replace(BOTH_PHASE, ENGLISH_PHASE)))

        sessions().signIn("ines@sotoverde.es", "contrasena")
        town().startWork(TownBuildingKind.Farm)

        assertEquals(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.English), languages.language.value)
    }

    @Test
    fun `keeps the phase of a later read when an earlier one answers last`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "scaffold"))
        sessions().signIn("ines@sotoverde.es", "contrasena")
        api.takeRequest(REQUEST_WAIT_SECONDS, TimeUnit.SECONDS)
        val answers = HeldAnswers()
        val restoreAnswer: CountDownLatch =
            answers.holding(SESSION_PATH, json(200, playerJson(scaffold = "es", chromePhase = "scaffold")))
        answers.answering(TOWN_PATH, json(200, TOWN_READ_IN_THE_BOTH_PHASE))
        api.dispatcher = answers

        val restore: Deferred<RestoreResult> = async(start = CoroutineStart.UNDISPATCHED) { sessions().restore() }
        api.takeRequest(REQUEST_WAIT_SECONDS, TimeUnit.SECONDS)
        town().read()
        restoreAnswer.countDown()
        restore.await()

        assertEquals(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both), languages.language.value)
    }

    @Test
    fun `keeps the phase when a town read names one the client does not know`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "both"))
        api.enqueue(json(200, TOWN_READ_IN_THE_BOTH_PHASE.replace(BOTH_PHASE, "\"chromePhase\":\"latin\"")))

        sessions().signIn("ines@sotoverde.es", "contrasena")
        town().read()

        assertEquals(PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Both), languages.language.value)
    }

    @Test
    fun `forgets the language when the player signs out`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "both"))
        api.enqueue(MockResponse.Builder().code(204).build())

        sessions().signIn("ines@sotoverde.es", "contrasena")
        sessions().signOut()

        assertNull(languages.language.value)
    }

    @Test
    fun `never holds the phase of a read sent before the session ended`() = runTest {
        api.enqueue(session(code = 200, scaffold = "es", chromePhase = "scaffold"))
        sessions().signIn("ines@sotoverde.es", "contrasena")
        api.takeRequest(REQUEST_WAIT_SECONDS, TimeUnit.SECONDS)
        val answers = HeldAnswers()
        val townAnswer: CountDownLatch = answers.holding(TOWN_PATH, json(200, TOWN_READ_IN_THE_BOTH_PHASE))
        answers.answering(SIGN_OUT_PATH, MockResponse.Builder().code(204).build())
        api.dispatcher = answers

        val read: Deferred<TownReadResult> = async(start = CoroutineStart.UNDISPATCHED) { town().read() }
        api.takeRequest(REQUEST_WAIT_SECONDS, TimeUnit.SECONDS)
        sessions().signOut()
        townAnswer.countDown()
        read.await()

        assertNull(languages.language.value)
    }

    private fun TestScope.sessions(): SessionRepository = SessionRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        languages = languages,
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun TestScope.town(): TownRepository = TownRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        languages = languages,
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:04:00Z")),
    )

    private fun session(code: Int, scaffold: String, chromePhase: String): MockResponse =
        json(code, """{"token":"opaque-session","player":${playerJson(scaffold, chromePhase)}}""")

    private fun playerJson(scaffold: String, chromePhase: String): String =
        """{"id":"0b6f2f2e-6a43-4a8e-9c4e-2f1d3c4b5a69","email":"ines@sotoverde.es",""" +
            """"emailVerified":true,"scaffold":"$scaffold","chromePhase":"$chromePhase"}"""

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder()
            .code(code)
            .addHeader("Content-Type", "application/json")
            .body(body)
            .build()

    private class HeldAnswers : Dispatcher() {
        private val answers: MutableMap<String, Pair<MockResponse, CountDownLatch>> = ConcurrentHashMap()

        fun holding(path: String, response: MockResponse): CountDownLatch {
            val release = CountDownLatch(1)
            answers[path] = response to release
            return release
        }

        fun answering(path: String, response: MockResponse) {
            answers[path] = response to CountDownLatch(0)
        }

        override fun dispatch(request: RecordedRequest): MockResponse {
            val (response: MockResponse, release: CountDownLatch) = answers.getValue(request.url.encodedPath)
            release.await(REQUEST_WAIT_SECONDS, TimeUnit.SECONDS)
            return response
        }
    }

    private companion object {
        const val REQUEST_WAIT_SECONDS: Long = 5L
        const val SESSION_PATH: String = "/api/auth/session"
        const val TOWN_PATH: String = "/api/town"
        const val SIGN_OUT_PATH: String = "/api/auth/sign-out"
        const val BOTH_PHASE: String = """"chromePhase":"both""""
        const val ENGLISH_PHASE: String = """"chromePhase":"english""""
        const val NOTHING: String = """{"money":0,"food":0,"power":0,"material":0}"""
        const val HOMES_COST: String = """{"money":60,"food":0,"power":0,"material":30}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val OPEN_ORDER: String =
            """"order":{"hire":"truck","count":3,"delivered":1,"secondsPerHire":180,""" +
                """"startedAt":"2026-11-05T10:00:00.000Z","endsAt":"2026-11-05T10:09:00.000Z"}"""
        const val ORDER_START: String = "2026-11-05T10:00:00.000Z"
        const val HIRING: String =
            """{"order":null,"hires":{"worker":0,"truck":0},"terms":{""" +
                """"worker":{"cost":{"money":40,"food":0,"power":0,"material":0},"secondsPerHire":60,""" +
                """"people":1,"requiredOfficeLevel":1},""" +
                """"truck":{"cost":{"money":80,"food":40,"power":40,"material":60},"secondsPerHire":180,""" +
                """"people":1,"requiredOfficeLevel":3}}}"""
        const val TOWN_READ_IN_THE_BOTH_PHASE: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":1,"site":1},"terrain":"fields",""" +
                """"season":{"kind":"fall","year":1,"endsAt":"2026-11-08T00:00:00.000Z"},""" +
                """"stocks":{"money":{"amount":120,"ratePerHour":30.5,"capacity":1000,""" +
                """"fullAt":"2026-11-06T14:51:09.000Z"},""" +
                """"food":{"amount":80,"ratePerHour":12,"capacity":1000,"fullAt":null},""" +
                """"power":{"amount":60,"ratePerHour":0,"capacity":1000,"fullAt":null},""" +
                """"material":{"amount":40,"ratePerHour":7,"capacity":1000,"fullAt":null}},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":{"level":1,"nextLevel":{"level":2,"cost":$HOMES_COST,""" +
                """"durationSeconds":90,"people":3}},"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":{"level":10,"nextLevel":null}},""" +
                """"work":{"slot":{"building":"farm","level":2,"cost":$NOTHING,""" +
                """"startsAt":"2026-11-05T10:00:00.000Z","finishesAt":"2026-11-05T10:10:00.000Z"},""" +
                """"waitingList":[{"building":"school","level":3,"cost":$NOTHING,""" +
                """"startsAt":"2026-11-05T10:10:00.000Z","finishesAt":"2026-11-05T10:30:00.000Z"}],"cap":2},""" +
                """"hiring":$HIRING,"job":null,""" +
                """"lessons":[],"releasedLessons":[],"dueHoldoutChecks":[],"skills":[],""" +
                """"lessonSlot":{"lessonId":"lesson-1","startedAt":"2026-11-05T10:00:00.000Z",""" +
                """"finishesAt":"2026-11-05T10:20:00.000Z"},""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null},""" +
                """"nextStep":{"kind":"caughtUp","goal":null},"tip":null,""" +
                """"chromePhase":"both","nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""
    }
}
