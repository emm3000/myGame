package com.emm.mygame.core.network

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.core.network.platform.TokenStore
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

abstract class TownRepositoryFixture {

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

    protected fun TestScope.town(store: TokenStore = signedIn()): TownRepository = apiRepositories(
        endpoint = slowMachineEndpoint(api.url("/api/").toString()),
        tokenStore = store,
        sessionEnds = sessionEnds,
        clock = TestClock(testScheduler, aMinuteBeforeTheRead),
    ).towns

    protected fun TestScope.sessions(store: TokenStore): SessionRepository = apiRepositories(
        endpoint = slowMachineEndpoint(api.url("/api/").toString()),
        tokenStore = store,
        sessionEnds = sessionEnds,
    ).sessions

    protected fun signedIn(): TokenStore =
        TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }

    protected fun townWithNextStep(step: String): String =
        TOWN.replace("""{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":null}""", step)

    protected fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    protected companion object {
        val aMinuteBeforeTheRead: Instant = Instant.parse("2026-11-05T10:04:00Z")
        val moneyFullAt: Instant = Instant.parse("2026-11-06T14:51:09Z")
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
        const val TOWN: String =
            """{"name":"Riverton","label":"town","site":{"region":1,"area":1,"site":1},"terrain":"fields",""" +
                """"season":{"kind":"fall","year":1,"endsAt":"2026-11-08T00:00:00.000Z",""" +
                """"productionPercent":{"money":100,"food":100,"power":100,"material":100},""" +
                """"durationPercent":{"build":100,"study":100,"hire":100,"road":75}},""" +
                """"stocks":{"money":{"amount":120,"ratePerHour":30.5,"capacity":1000,""" +
                """"fullAt":"2026-11-06T14:51:09.000Z"},""" +
                """"food":{"amount":80,"ratePerHour":12,"capacity":1000,"fullAt":null},""" +
                """"power":{"amount":60,"ratePerHour":0,"capacity":1000,"fullAt":null},""" +
                """"material":{"amount":40,"ratePerHour":7,"capacity":1000,"fullAt":null}},""" +
                """"people":{"supplied":10,"free":4,"atWork":6},""" +
                """"buildings":{"homes":{"level":1,"nextLevel":{"level":2,"cost":$HOMES_COST,""" +
                """"durationSeconds":90,"people":3,"wordsNeeded":null}},""" +
                """"farm":$FLAT,"factory":$FLAT,"powerStation":$FLAT,""" +
                """"storage":$FLAT,"school":$FLAT,"office":{"level":10,"nextLevel":null}},""" +
                """"work":{"slot":{"building":"farm","level":2,"cost":$NOTHING,""" +
                """"startsAt":"2026-11-05T10:00:00.000Z","finishesAt":"2026-11-05T10:10:00.000Z"},""" +
                """"waitingList":[{"building":"school","level":3,"cost":$NOTHING,""" +
                """"startsAt":"2026-11-05T10:10:00.000Z","finishesAt":"2026-11-05T10:30:00.000Z"}],"cap":2},""" +
                """"hiring":$HIRING,"job":null,""" +
                """"lessons":[],"releasedLessons":[],"texts":[],"dueHoldoutChecks":[],""" +
                """"hasBandStarted":false,"bandLines":[],"skills":[],""" +
                """"lessonSlot":{"lessonId":"lesson-1","startedAt":"2026-11-05T10:00:00.000Z",""" +
                """"finishesAt":"2026-11-05T10:20:00.000Z"},""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null,"nextInLearningDueAt":null},""" +
                """"stableWordCount":0,"retainedWordCount":0,""" +
                """"nextStep":{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":null},"tip":null,""" +
                """"chromePhase":"scaffold","scaffold":"es","scaffoldVersion":0,"nextDueAt":null,""" +
                """"readAt":"2026-11-05T10:05:00.000Z"}"""

        val TOWN_WITH_RETAINED_WORDS: String =
            TOWN.replace(""""retainedWords":null""", """"retainedWords":{"count":3,"total":5}""")
    }
}
