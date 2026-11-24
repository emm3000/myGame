package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.network.FakeTokenCipher
import com.emm.mygame.core.network.apiRepositories
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.platform.slowMachineEndpoint
import com.emm.mygame.core.testing.TestClock
import java.io.File
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TemporaryFolder

abstract class SessionRepositoryFixture {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    protected val api: MockWebServer = MockWebServer()

    protected val sessionEnds: SessionEnds = SessionEnds()

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    protected fun TestScope.repository(
        store: TokenStore,
        languages: PlayerLanguages = PlayerLanguages(store, onNamed = {}),
    ): SessionRepository =
        apiRepositories(
            endpoint = slowMachineEndpoint(api.url("/api/").toString()),
            tokenStore = store,
            languages = languages,
            sessionEnds = sessionEnds,
        ).sessions

    protected fun TestScope.townRepository(store: TokenStore): TownRepository =
        apiRepositories(
            endpoint = slowMachineEndpoint(api.url("/api/").toString()),
            tokenStore = store,
            sessionEnds = sessionEnds,
            clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")),
        ).towns

    protected fun tokenStore(): TokenStore = tokenStore(FakeTokenCipher())

    protected fun tokenStore(cipher: FakeTokenCipher): TokenStore = TokenStore(sessionFile(), cipher)

    protected fun sessionFile(): File = File(folder.root, "session")

    protected fun nativeSession(token: String, email: String): MockResponse =
        json(200, """{"token":"$token","player":${playerJson(email, isEmailVerified = true)}}""")

    protected fun player(email: String): MockResponse = json(200, playerJson(email, isEmailVerified = true))

    protected fun refusal(kind: String): MockResponse = json(401, refusalJson(kind))

    protected fun refusalJson(kind: String): String = """{"kind":"$kind"}"""

    protected fun playerJson(email: String, isEmailVerified: Boolean): String =
        """{"id":"0b6f2f2e-6a43-4a8e-9c4e-2f1d3c4b5a69","email":"$email",""" +
            """"emailVerified":$isEmailVerified,"scaffold":"es","scaffoldVersion":0,"chromePhase":"scaffold"}"""

    protected fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()
}
