package com.emm.mygame.core.network

import app.cash.turbine.test
import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
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

class ScaffoldChangeRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val sessionEnds: SessionEnds = SessionEnds()

    private val store: TokenStore by lazy {
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }
    }

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
    fun `puts the picked scaffold alone to the player's scaffold`() = runTest {
        api.enqueue(player(scaffold = "none", chromePhase = "english"))

        sessions().changeScaffold(PlayerScaffold.None)

        val sent: RecordedRequest = api.takeRequestWithin()
        assertEquals("PUT /api/player/scaffold", "${sent.method} ${sent.url.encodedPath}")
        assertEquals("""{"scaffold":"none"}""", sent.body?.utf8())
    }

    @Test
    fun `puts the change with the stored token as a bearer`() = runTest {
        api.enqueue(player(scaffold = "es", chromePhase = "scaffold"))

        sessions().changeScaffold(PlayerScaffold.Spanish)

        assertEquals("Bearer opaque-session", api.takeRequestWithin().headers["Authorization"])
    }

    @Test
    fun `answers the player the api answers with the new scaffold`() = runTest {
        api.enqueue(player(scaffold = "none", chromePhase = "english"))

        val result: ScaffoldChangeResult = sessions().changeScaffold(PlayerScaffold.None)

        assertEquals(
            ScaffoldChangeResult.Changed(
                SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = PlayerScaffold.None),
            ),
            result,
        )
    }

    @Test
    fun `holds the language the change answers`() = runTest {
        api.enqueue(player(scaffold = "none", chromePhase = "english"))

        sessions().changeScaffold(PlayerScaffold.None)

        assertEquals(PlayerLanguage(PlayerScaffold.None, PlayerChromePhase.English), languages.language.value)
    }

    @Test
    fun `answers refused when the api refuses the change`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        val result: ScaffoldChangeResult = sessions().changeScaffold(PlayerScaffold.None)

        assertEquals(ScaffoldChangeResult.Refused, result)
    }

    @Test
    fun `answers unreachable when the api fails the change`() = runTest {
        api.enqueue(MockResponse.Builder().code(503).build())

        val result: ScaffoldChangeResult = sessions().changeScaffold(PlayerScaffold.None)

        assertEquals(ScaffoldChangeResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the change cannot reach the api`() = runTest {
        val sessions: SessionRepository = sessions()
        api.close()

        val result: ScaffoldChangeResult = sessions.changeScaffold(PlayerScaffold.None)

        assertEquals(ScaffoldChangeResult.Unreachable, result)
    }

    @Test
    fun `answers unreachable when the change answers 401`() = runTest {
        api.enqueue(MockResponse.Builder().code(401).build())

        val result: ScaffoldChangeResult = sessions().changeScaffold(PlayerScaffold.None)

        assertEquals(ScaffoldChangeResult.Unreachable, result)
    }

    @Test
    fun `ends the session when the change answers 401`() = runTest {
        val sessions: SessionRepository = sessions()
        api.enqueue(MockResponse.Builder().code(401).build())

        sessionEnds.ended.test {
            sessions.changeScaffold(PlayerScaffold.None)

            awaitItem()
        }
    }

    @Test
    fun `holds the language a change answers after its asker has left`() = runTest {
        val release = CountDownLatch(1)
        api.dispatcher = HeldAnswer(player(scaffold = "none", chromePhase = "english"), release)
        val asker: Job = launch(start = CoroutineStart.UNDISPATCHED) { sessions().changeScaffold(PlayerScaffold.None) }
        api.takeRequestWithin()

        asker.cancel()
        release.countDown()

        assertEquals(
            PlayerLanguage(PlayerScaffold.None, PlayerChromePhase.English),
            languages.language.first { language: PlayerLanguage? -> language != null },
        )
    }

    @Test
    fun `never holds the language of a change answered after the session ended`() = runTest {
        val release = CountDownLatch(1)
        val answers = PathAnswers(
            mapOf(
                SCAFFOLD_PATH to (player(scaffold = "none", chromePhase = "english") to release),
                SIGN_OUT_PATH to (MockResponse.Builder().code(204).build() to CountDownLatch(0)),
            ),
        )
        api.dispatcher = answers
        val change: Deferred<ScaffoldChangeResult> =
            async(start = CoroutineStart.UNDISPATCHED) { sessions().changeScaffold(PlayerScaffold.None) }
        api.takeRequestWithin()

        sessions().signOut()
        release.countDown()
        change.await()

        assertNull(languages.language.value)
    }

    @Test
    fun `restores the scaffold the session names`() = runTest {
        api.enqueue(player(scaffold = "none", chromePhase = "english"))

        val result: RestoreResult = sessions().restore()

        assertEquals(
            RestoreResult.SignedIn(
                SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = PlayerScaffold.None),
            ),
            result,
        )
    }

    @Test
    fun `restores no scaffold when the session names one the client does not know`() = runTest {
        api.enqueue(player(scaffold = "pt", chromePhase = "scaffold"))

        val result: RestoreResult = sessions().restore()

        assertEquals(
            RestoreResult.SignedIn(
                SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = null),
            ),
            result,
        )
    }

    private fun TestScope.sessions(): SessionRepository = SessionRepository(
        baseUrl = api.url("/api/").toString(),
        tokenStore = store,
        languages = languages,
        sessionEnds = sessionEnds,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun player(scaffold: String, chromePhase: String): MockResponse =
        MockResponse.Builder()
            .code(200)
            .addHeader("Content-Type", "application/json")
            .body(
                """{"id":"0b6f2f2e-6a43-4a8e-9c4e-2f1d3c4b5a69","email":"ines@sotoverde.es",""" +
                    """"emailVerified":true,"scaffold":"$scaffold","chromePhase":"$chromePhase"}""",
            )
            .build()

    private class HeldAnswer(private val response: MockResponse, private val release: CountDownLatch) : Dispatcher() {

        override fun dispatch(request: RecordedRequest): MockResponse {
            release.await(RELEASE_WAIT_SECONDS, TimeUnit.SECONDS)
            return response
        }
    }

    private class PathAnswers(private val answers: Map<String, Pair<MockResponse, CountDownLatch>>) : Dispatcher() {

        override fun dispatch(request: RecordedRequest): MockResponse {
            val (response: MockResponse, release: CountDownLatch) = answers.getValue(request.url.encodedPath)
            release.await(RELEASE_WAIT_SECONDS, TimeUnit.SECONDS)
            return response
        }
    }

    private companion object {
        const val RELEASE_WAIT_SECONDS: Long = 5L
        const val SCAFFOLD_PATH: String = "/api/player/scaffold"
        const val SIGN_OUT_PATH: String = "/api/auth/sign-out"
    }
}
