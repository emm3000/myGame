package com.emm.mygame.core.network

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.account.SignInResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.network.platform.ApiEndpoint
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.testing.TestClock
import java.io.File
import java.util.concurrent.TimeUnit
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Instant
import kotlin.time.toJavaDuration
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ApiEndpointTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    private val sessionEnds: SessionEnds = SessionEnds()

    private val impatience: Duration = 200.milliseconds

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `gives up a signed-in read when the endpoint's client stops waiting`() = runTest {
        api.enqueue(slowAnswer(code = 404, body = """{"kind":"TownNotFound"}"""))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `gives up a sign-in when the endpoint's client stops waiting`() = runTest {
        api.enqueue(slowAnswer(code = 401, body = """{"kind":"InvalidCredentials"}"""))

        assertEquals(SignInResult.Unreachable, sessions().signIn("ines@sotoverde.es", "equivocada"))
    }

    private fun TestScope.town(): TownRepository {
        val store: TokenStore = signedIn()
        return apiRepositories(
            endpoint = impatientEndpoint(),
            tokenStore = store,
            sessionEnds = sessionEnds,
            clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")),
        ).towns
    }

    private fun TestScope.sessions(): SessionRepository {
        val store: TokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher())
        return apiRepositories(
            endpoint = impatientEndpoint(),
            tokenStore = store,
            sessionEnds = sessionEnds,
        ).sessions
    }

    private fun impatientEndpoint(): ApiEndpoint =
        ApiEndpoint(
            baseUrl = api.url("/api/").toString(),
            newHttpClientBuilder = { OkHttpClient.Builder().readTimeout(impatience.toJavaDuration()) },
        )

    private fun signedIn(): TokenStore =
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }

    private fun slowAnswer(code: Int, body: String): MockResponse =
        MockResponse.Builder()
            .code(code)
            .addHeader("Content-Type", "application/json")
            .body(body)
            .headersDelay(1, TimeUnit.SECONDS)
            .build()
}
