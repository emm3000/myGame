package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class HoldoutCheckRepositoryTest {

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
    fun `reads the checks at their path with the bearer`() = runTest {
        api.enqueue(json(200, checks()))

        holdoutChecks().read()

        val request: RecordedRequest = api.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/holdout-checks", request.url.encodedPath)
        assertEquals("Bearer opaque-token", request.headers["Authorization"])
    }

    @Test
    fun `reads a due check with its band and week`() = runTest {
        api.enqueue(json(200, checks(due(band = 1, week = 8))))

        assertEquals(
            HoldoutChecksReadResult.Read(listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth))),
            holdoutChecks().read(),
        )
    }

    @Test
    fun `reads an asking check with its words and choices in the api's order`() = runTest {
        api.enqueue(json(200, checks(asking(band = 2, week = 24))))

        assertEquals(
            HoldoutChecksReadResult.Read(
                listOf(
                    HoldoutCheck.Asking(
                        band = PlacementBand.Second,
                        week = HoldoutCheckWeek.TwentyFourth,
                        items = listOf(houseItem, walkItem),
                    ),
                ),
            ),
            holdoutChecks().read(),
        )
    }

    @Test
    fun `reads every check in the api's order`() = runTest {
        api.enqueue(json(200, checks(due(band = 2, week = 8), due(band = 1, week = 24))))

        assertEquals(
            HoldoutChecksReadResult.Read(
                listOf(
                    HoldoutCheck.Due(PlacementBand.Second, HoldoutCheckWeek.Eighth),
                    HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.TwentyFourth),
                ),
            ),
            holdoutChecks().read(),
        )
    }

    @Test
    fun `reads no check when none is due`() = runTest {
        api.enqueue(json(200, checks()))

        assertEquals(HoldoutChecksReadResult.Read(emptyList()), holdoutChecks().read())
    }

    @Test
    fun `answers unreachable for a band the contract does not name`() = runTest {
        api.enqueue(json(200, checks(due(band = 4, week = 8))))

        assertEquals(HoldoutChecksReadResult.Unreachable, holdoutChecks().read())
    }

    @Test
    fun `answers unreachable for a week the contract does not name`() = runTest {
        api.enqueue(json(200, checks(due(band = 1, week = 12))))

        assertEquals(HoldoutChecksReadResult.Unreachable, holdoutChecks().read())
    }

    @Test
    fun `answers unreachable for a check kind the contract does not name`() = runTest {
        api.enqueue(json(200, checks("""{"kind":"lapsed","band":1,"week":8}""")))

        assertEquals(HoldoutChecksReadResult.Unreachable, holdoutChecks().read())
    }

    @Test
    fun `answers unreachable when the read fails`() = runTest {
        api.enqueue(json(500, ""))

        assertEquals(HoldoutChecksReadResult.Unreachable, holdoutChecks().read())
    }

    @Test
    fun `answers unreachable when the read cannot reach the api`() = runTest {
        val repository: HoldoutCheckRepository = holdoutChecks()
        api.close()

        assertEquals(HoldoutChecksReadResult.Unreachable, repository.read())
    }

    @Test
    fun `begins the check at its band and week`() = runTest {
        api.enqueue(json(200, checks(asking(band = 1, week = 8))))

        val answer: HoldoutCheckChangeResult = holdoutChecks().begin(PlacementBand.First, HoldoutCheckWeek.Eighth)

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/holdout-checks/1/8", request.url.encodedPath)
        assertEquals(
            HoldoutCheckChangeResult.Changed(
                listOf(HoldoutCheck.Asking(PlacementBand.First, HoldoutCheckWeek.Eighth, listOf(houseItem, walkItem))),
            ),
            answer,
        )
    }

    @Test
    fun `skips the check at its band and week`() = runTest {
        api.enqueue(json(200, checks()))

        val answer: HoldoutCheckChangeResult =
            holdoutChecks().skip(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/holdout-checks/2/24/skip", request.url.encodedPath)
        assertEquals(HoldoutCheckChangeResult.Changed(emptyList()), answer)
    }

    @Test
    fun `sends every answer of the check in one request`() = runTest {
        api.enqueue(json(200, checks()))

        holdoutChecks().answer(
            PlacementBand.First,
            HoldoutCheckWeek.Eighth,
            listOf(
                PlacementAnswer(WordId("word-1"), ChoiceId("choice-a")),
                PlacementAnswer(WordId("word-2"), ChoiceId("choice-d")),
            ),
        )

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/holdout-checks/1/8/answers", request.url.encodedPath)
        assertEquals(
            """{"answers":[{"wordId":"word-1","choiceId":"choice-a"},{"wordId":"word-2","choiceId":"choice-d"}]}""",
            request.body?.utf8(),
        )
    }

    @Test
    fun `answers the checks the api left after the answers`() = runTest {
        api.enqueue(json(200, checks(due(band = 1, week = 24))))

        assertEquals(
            HoldoutCheckChangeResult.Changed(
                listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.TwentyFourth)),
            ),
            holdoutChecks().answer(PlacementBand.First, HoldoutCheckWeek.Eighth, listOf(oneAnswer)),
        )
    }

    @Test
    fun `answers the check not open for a conflict with an empty body`() = runTest {
        api.enqueue(json(409, ""))

        assertEquals(
            HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.NotOpen),
            holdoutChecks().begin(PlacementBand.First, HoldoutCheckWeek.Eighth),
        )
    }

    @Test
    fun `answers the check not open for a skip the api refuses`() = runTest {
        api.enqueue(json(409, ""))

        assertEquals(
            HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.NotOpen),
            holdoutChecks().skip(PlacementBand.First, HoldoutCheckWeek.Eighth),
        )
    }

    @Test
    fun `answers an invalid request for answers the api cannot take`() = runTest {
        api.enqueue(json(400, ""))

        assertEquals(
            HoldoutCheckChangeResult.Refused(HoldoutCheckRefusal.InvalidRequest),
            holdoutChecks().answer(PlacementBand.First, HoldoutCheckWeek.Eighth, listOf(oneAnswer)),
        )
    }

    @Test
    fun `answers unreachable when a change fails`() = runTest {
        api.enqueue(json(500, ""))

        assertEquals(
            HoldoutCheckChangeResult.Unreachable,
            holdoutChecks().skip(PlacementBand.First, HoldoutCheckWeek.Eighth),
        )
    }

    @Test
    fun `answers unreachable when a change cannot reach the api`() = runTest {
        val repository: HoldoutCheckRepository = holdoutChecks()
        api.close()

        assertEquals(
            HoldoutCheckChangeResult.Unreachable,
            repository.answer(PlacementBand.First, HoldoutCheckWeek.Eighth, listOf(oneAnswer)),
        )
    }

    @Test
    fun `answers unreachable when a change answers a band the contract does not name`() = runTest {
        api.enqueue(json(200, checks(due(band = 9, week = 8))))

        assertEquals(
            HoldoutCheckChangeResult.Unreachable,
            holdoutChecks().begin(PlacementBand.First, HoldoutCheckWeek.Eighth),
        )
    }

    private val oneAnswer: PlacementAnswer = PlacementAnswer(WordId("word-1"), ChoiceId("choice-a"))

    private val houseItem: PlacementItem = PlacementItem(
        word = WordId("word-1"),
        text = "house",
        choices = listOf(PlacementChoice(ChoiceId("choice-a"), "casa"), PlacementChoice(ChoiceId("choice-b"), "perro")),
    )

    private val walkItem: PlacementItem = PlacementItem(
        word = WordId("word-2"),
        text = "walk",
        choices = listOf(
            PlacementChoice(ChoiceId("choice-c"), "correr"),
            PlacementChoice(ChoiceId("choice-d"), "caminar"),
        ),
    )

    private fun TestScope.holdoutChecks(): HoldoutCheckRepository {
        val store: TokenStore = TokenStore(file = File(folder.root, "session"), cipher = FakeTokenCipher())
        store.write("opaque-token")
        return HoldoutCheckRepository(
            baseUrl = api.url("/").toString(),
            tokenStore = store,
            sessionEnds = SessionEnds(),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private fun checks(vararg states: String): String = """{"checks":[${states.joinToString(",")}]}"""

    private fun due(band: Int, week: Int): String = """{"kind":"due","band":$band,"week":$week}"""

    private fun asking(band: Int, week: Int): String =
        """{"kind":"asking","band":$band,"week":$week,"items":[$HOUSE,$WALK]}"""

    private companion object {
        const val HOUSE: String =
            """{"wordId":"word-1","word":"house","choices":[{"choiceId":"choice-a","gloss":"casa"},""" +
                """{"choiceId":"choice-b","gloss":"perro"}]}"""
        const val WALK: String =
            """{"wordId":"word-2","word":"walk","choices":[{"choiceId":"choice-c","gloss":"correr"},""" +
                """{"choiceId":"choice-d","gloss":"caminar"}]}"""
    }
}
