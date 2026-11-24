package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TownWordsRepositoryTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    private val api: MockWebServer = MockWebServer()

    @Before
    fun startApi() {
        api.start()
    }

    @After
    fun stopApi() {
        api.close()
    }

    @Test
    fun `reads the town's stable and retained words`() = runTest {
        api.enqueue(json(200, townWithWords(stable = 14, retained = 3)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(14 to 3, read.stableWordCount to read.retainedWordCount)
    }

    @Test
    fun `reads a stable need with the stable words as held`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("""{"count":10,"standing":"stable"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.WordsNeeded(10, NeededWordKind.Stable, held = 14), farmOf(read).next?.wordsNeeded)
    }

    @Test
    fun `reads a retained need with the retained words as held`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("""{"count":50,"standing":"retained"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.WordsNeeded(50, NeededWordKind.Retained, held = 3), farmOf(read).next?.wordsNeeded)
    }

    @Test
    fun `reads no need where the api names none`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("null")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, farmOf(read).next?.wordsNeeded)
    }

    @Test
    fun `answers Unreachable for a need of a standing the client does not know`() = runTest {
        api.enqueue(json(200, townWithFarmNeed("""{"count":10,"standing":"proven"}""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    private fun TestScope.town(): TownRepository {
        val store: TokenStore =
            TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }
        return apiRepositories(
            endpoint = slowMachineEndpoint(api.url("/api/").toString()),
            tokenStore = store,
            clock = TestClock(testScheduler, Instant.parse("2026-11-13T10:00:00Z")),
        ).towns
    }

    private fun townWithWords(stable: Int, retained: Int): String = TOWN.replace(
        """"stableWordCount":0,"retainedWordCount":0""",
        """"stableWordCount":$stable,"retainedWordCount":$retained""",
    )

    private fun townWithFarmNeed(need: String): String = townWithWords(stable = 14, retained = 3).replace(
        """"farm":$FLAT""",
        """"farm":{"level":2,"nextLevel":{"level":3,"cost":$COST,"durationSeconds":90,"people":1,""" +
            """"wordsNeeded":$need}}""",
    )

    private fun farmOf(town: TownSnapshot): TownSnapshot.Building =
        town.buildings.first { place: TownSnapshot.Building -> place.kind == TownBuildingKind.Farm }

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val STOCK: String = """{"amount":120,"ratePerHour":30.5,"capacity":1000,"fullAt":null}"""
        const val FLAT: String = """{"level":1,"nextLevel":null}"""
        const val COST: String = """{"money":60,"food":0,"power":0,"material":30}"""
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
                """"hasBandStarted":false,"bandLines":[],"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null,"nextInLearningDueAt":null},""" +
                """"stableWordCount":0,"retainedWordCount":0,""" +
                """"nextStep":{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":null},"tip":null,""" +
                """"chromePhase":"scaffold","scaffold":"es","scaffoldVersion":0,"nextDueAt":null,""" +
                """"readAt":"2026-11-13T10:00:00.000Z"}"""
    }
}
