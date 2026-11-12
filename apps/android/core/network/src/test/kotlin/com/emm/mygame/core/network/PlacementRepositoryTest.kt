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

class PlacementRepositoryTest {

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
    fun `reads the placement at its path with the bearer`() = runTest {
        api.enqueue(json(200, OFFERED))

        placements().read()

        val request: RecordedRequest = api.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/placement", request.url.encodedPath)
        assertEquals("Bearer opaque-token", request.headers["Authorization"])
    }

    @Test
    fun `reads an offered placement`() = runTest {
        api.enqueue(json(200, OFFERED))

        assertEquals(PlacementReadResult.Read(Placement.Offered), placements().read())
    }

    @Test
    fun `reads the asked band with its words and choices in the api's order`() = runTest {
        api.enqueue(json(200, asking(band = 2, scores = score(band = 1, score = 30, isPlacedOut = true))))

        assertEquals(
            PlacementReadResult.Read(
                Placement.Asking(
                    band = PlacementBand.Second,
                    items = listOf(houseItem, walkItem),
                    scores = listOf(PlacementScore(PlacementBand.First, score = 30, isPlacedOut = true)),
                ),
            ),
            placements().read(),
        )
    }

    @Test
    fun `reads a closed placement with each band's score as the api placed it`() = runTest {
        val passed: String = score(band = 1, score = 30, isPlacedOut = true)
        val failed: String = score(band = 2, score = 29, isPlacedOut = false)
        api.enqueue(json(200, closed("$passed,$failed")))

        assertEquals(
            PlacementReadResult.Read(
                Placement.Closed(
                    listOf(
                        PlacementScore(PlacementBand.First, score = 30, isPlacedOut = true),
                        PlacementScore(PlacementBand.Second, score = 29, isPlacedOut = false),
                    ),
                ),
            ),
            placements().read(),
        )
    }

    @Test
    fun `answers unreachable for a band the contract does not name`() = runTest {
        api.enqueue(json(200, closed(score(band = 4, score = 30, isPlacedOut = true))))

        assertEquals(PlacementReadResult.Unreachable, placements().read())
    }

    @Test
    fun `answers unreachable for a placement kind the contract does not name`() = runTest {
        api.enqueue(json(200, """{"kind":"paused"}"""))

        assertEquals(PlacementReadResult.Unreachable, placements().read())
    }

    @Test
    fun `answers unreachable when the read fails`() = runTest {
        api.enqueue(json(500, ""))

        assertEquals(PlacementReadResult.Unreachable, placements().read())
    }

    @Test
    fun `answers unreachable when the read cannot reach the api`() = runTest {
        val repository: PlacementRepository = placements()
        api.close()

        assertEquals(PlacementReadResult.Unreachable, repository.read())
    }

    @Test
    fun `begins the placement at its path`() = runTest {
        api.enqueue(json(200, asking(band = 1)))

        val answer: PlacementChangeResult = placements().begin()

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/placement", request.url.encodedPath)
        assertEquals(
            PlacementChangeResult.Changed(
                Placement.Asking(PlacementBand.First, listOf(houseItem, walkItem), emptyList()),
            ),
            answer,
        )
    }

    @Test
    fun `skips the placement at its path`() = runTest {
        api.enqueue(json(200, closed("")))

        val answer: PlacementChangeResult = placements().skip()

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/placement/skip", request.url.encodedPath)
        assertEquals(PlacementChangeResult.Changed(Placement.Closed(emptyList())), answer)
    }

    @Test
    fun `sends the band's answers in one request`() = runTest {
        api.enqueue(json(200, closed(score(band = 1, score = 12, isPlacedOut = false))))

        placements().answer(
            PlacementBand.First,
            listOf(
                PlacementAnswer(WordId("word-1"), ChoiceId("choice-a")),
                PlacementAnswer(WordId("word-2"), ChoiceId("choice-d")),
            ),
        )

        val request: RecordedRequest = api.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/placement/answers", request.url.encodedPath)
        assertEquals(
            """{"band":1,"answers":[{"wordId":"word-1","choiceId":"choice-a"},""" +
                """{"wordId":"word-2","choiceId":"choice-d"}]}""",
            request.body?.utf8(),
        )
    }

    @Test
    fun `answers the placement the api scored`() = runTest {
        api.enqueue(json(200, closed(score(band = 1, score = 12, isPlacedOut = false))))

        assertEquals(
            PlacementChangeResult.Changed(
                Placement.Closed(listOf(PlacementScore(PlacementBand.First, score = 12, isPlacedOut = false))),
            ),
            placements().answer(PlacementBand.First, listOf(oneAnswer)),
        )
    }

    @Test
    fun `answers refused for a conflict with an empty body`() = runTest {
        api.enqueue(json(409, ""))

        assertEquals(PlacementChangeResult.Refused, placements().begin())
    }

    @Test
    fun `answers refused for answers the api cannot take`() = runTest {
        api.enqueue(json(400, ""))

        assertEquals(
            PlacementChangeResult.Refused,
            placements().answer(PlacementBand.First, listOf(oneAnswer)),
        )
    }

    @Test
    fun `answers unreachable when a change fails`() = runTest {
        api.enqueue(json(500, ""))

        assertEquals(PlacementChangeResult.Unreachable, placements().skip())
    }

    @Test
    fun `answers unreachable when a change cannot reach the api`() = runTest {
        val repository: PlacementRepository = placements()
        api.close()

        assertEquals(PlacementChangeResult.Unreachable, repository.skip())
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

    private fun TestScope.placements(): PlacementRepository {
        val store: TokenStore = TokenStore(file = File(folder.root, "session"), cipher = FakeTokenCipher())
        store.write("opaque-token")
        return PlacementRepository(
            baseUrl = api.url("/").toString(),
            tokenStore = store,
            sessionEnds = SessionEnds(),
            ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        )
    }

    private fun json(code: Int, body: String): MockResponse =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private fun asking(band: Int, scores: String = ""): String =
        """{"kind":"asking","band":$band,"items":[$HOUSE,$WALK],"scores":[$scores]}"""

    private fun closed(scores: String): String = """{"kind":"closed","scores":[$scores]}"""

    private fun score(band: Int, score: Int, isPlacedOut: Boolean): String =
        """{"band":$band,"score":$score,"takenAt":"2026-11-12T09:00:00.000Z","isPlacedOut":$isPlacedOut}"""

    private companion object {
        const val OFFERED: String = """{"kind":"offered"}"""
        const val HOUSE: String =
            """{"wordId":"word-1","word":"house","choices":[{"choiceId":"choice-a","gloss":"casa"},""" +
                """{"choiceId":"choice-b","gloss":"perro"}]}"""
        const val WALK: String =
            """{"wordId":"word-2","word":"walk","choices":[{"choiceId":"choice-c","gloss":"correr"},""" +
                """{"choiceId":"choice-d","gloss":"caminar"}]}"""
    }
}
