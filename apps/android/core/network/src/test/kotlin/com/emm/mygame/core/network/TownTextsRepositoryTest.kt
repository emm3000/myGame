package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import com.emm.mygame.core.testing.TestClock
import java.io.File
import kotlin.time.Instant
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

class TownTextsRepositoryTest {

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
    fun `reads the title of each open text on the town read`() = runTest {
        api.enqueue(json(200, townWithTexts(TEXT_TITLE)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(listOf(TownSnapshot.TextTitle(TextId("text-1"), "A New Course")), read.texts)
    }

    @Test
    fun `reads no text while the stage has opened none`() = runTest {
        api.enqueue(json(200, townWithTexts("")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(emptyList<TownSnapshot.TextTitle>(), read.texts)
    }

    @Test
    fun `reads one open text with the support of its spans`() = runTest {
        api.enqueue(json(200, OPEN_TEXT))

        assertEquals(TownTextResult.Read(courseText), texts().readText(TextId("text-1")))
    }

    @Test
    fun `asks for the text by its id`() = runTest {
        api.enqueue(json(200, OPEN_TEXT))

        texts().readText(TextId("text-1"))

        assertEquals("/api/town/texts/text-1", api.takeRequestWithin().url.encodedPath)
    }

    @Test
    fun `answers not open when the api finds no such text for the stage`() = runTest {
        api.enqueue(MockResponse.Builder().code(404).build())

        assertEquals(TownTextResult.NotOpen, texts().readText(TextId("text-9")))
    }

    @Test
    fun `answers no town when the player holds none`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(TownTextResult.NoTown, texts().readText(TextId("text-1")))
    }

    @Test
    fun `answers unreachable when the text read fails`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(TownTextResult.Unreachable, texts().readText(TextId("text-1")))
    }

    private val courseText: OpenText = OpenText(
        id = TextId("text-1"),
        title = "A New Course",
        sentences = listOf(
            listOf(
                FrameSpan(text = "I live by the ", support = null),
                FrameSpan(
                    text = "river",
                    support = WordSupport(WordSupport.Shown.Beside, "río", WordSupport.Language.Spanish),
                ),
                FrameSpan(text = ".", support = null),
            ),
        ),
    )

    private fun TestScope.texts(): TownTextRepository = TownTextRepository(
        endpoint = slowMachineEndpoint(api.url("/api/").toString()),
        tokenStore = TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") },
        sessionEnds = SessionEnds(),
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
    )

    private fun TestScope.town(): TownRepository {
        val store: TokenStore =
            TokenStore(File(folder.root, "session"), FakeTokenCipher()).apply { write("opaque-session") }
        return TownRepository(
            endpoint = slowMachineEndpoint(api.url("/api/").toString()),
            tokenStore = store,
            languages = PlayerLanguages(store, onNamed = {}),
            sessionEnds = SessionEnds(),
            studyAnswers = discardedStudyAnswers(store),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
            clock = TestClock(testScheduler, Instant.parse("2026-11-13T10:00:00Z")),
        )
    }

    private fun townWithTexts(texts: String): String = TOWN.replace(""""texts":[]""", """"texts":[$texts]""")

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private companion object {
        const val TEXT_TITLE: String = """{"id":"text-1","title":"A New Course"}"""
        const val OPEN_TEXT: String =
            """{"id":"text-1","title":"A New Course","sentences":[[""" +
                """{"text":"I live by the ","support":null},""" +
                """{"text":"river","support":{"shown":"beside","text":"río","language":"es"}},""" +
                """{"text":".","support":null}]]}"""
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
                """"hasBandStarted":false,"bandLines":[],"skills":[],"lessonSlot":null,""" +
                """"learning":{"cap":10,"inLearning":0,"retainedWords":null,"nextInLearningDueAt":null},""" +
                """"stableWordCount":0,"retainedWordCount":0,""" +
                """"nextStep":{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":null},"tip":null,""" +
                """"chromePhase":"scaffold","scaffold":"es","scaffoldVersion":0,"nextDueAt":null,""" +
                """"readAt":"2026-11-13T10:00:00.000Z"}"""
    }
}
